import io
import logging
import json
import httpx
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from psycopg import AsyncConnection
from psycopg.rows import dict_row

from app.core.db import get_db
from app.core.config import settings
from app.features.telegram.repositories.order_repository import OrderRepository
from app.features.telegram.services.notification import TelegramNotificationService

# ReportLab Imports for beautiful PDF Invoice generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger("flowerspet-admin-orders-api")
router = APIRouter()

class UpdateStatusRequest(BaseModel):
    status: str = Field(..., description="New status for the order: pending, processing, delivering, completed, cancelled")

# Translate statuses to beautiful Russian labels
STATUS_RU = {
    "pending": "⏳ В ожидании",
    "processing": "⚙️ В сборке",
    "delivering": "🚚 В доставке",
    "completed": "✅ Выполнен",
    "cancelled": "❌ Отменен"
}

@router.get("/")
async def list_orders(db: AsyncConnection = Depends(get_db)):
    """
    Retrieves all orders using the OrderRepository pattern.
    """
    repo = OrderRepository(db)
    orders = await repo.get_all_orders()
    return orders

@router.post("/{order_id}/status")
async def update_order_status(
    order_id: int, 
    payload: UpdateStatusRequest,
    background_tasks: BackgroundTasks,
    db: AsyncConnection = Depends(get_db)
):
    """
    Updates the status of an order.
    Triggers client push alerts and florist general chat notifications.
    """
    repo = OrderRepository(db)
    
    # Verify order exists
    order = await repo.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
        
    old_status = order["status"]
    new_status = payload.status
    
    if old_status == new_status:
        return {"status": "success", "message": "Статус не изменился", "order_id": order_id}

    # Update in Database
    updated = await repo.update_order_status(order_id, new_status)
    if not updated:
        raise HTTPException(status_code=500, detail="Ошибка при сохранении статуса")

    # Send Notification alerts as a background task to prevent blocking
    background_tasks.add_task(
        send_order_status_alerts,
        order_id,
        order["customer_name"],
        order["phone"],
        new_status
    )
    
    return {"status": "success", "message": f"Статус обновлен с {old_status} на {new_status}", "order_id": order_id}

async def send_order_status_alerts(order_id: int, customer_name: str, phone: str, status: str):
    """
    Helper task executing Telegram Push alerts for both customers and florists.
    """
    status_text = STATUS_RU.get(status, status)
    
    # ── Notification 1: General Florists/Workers Chat Alert ──────────────────
    florist_msg = (
        f"🔔 <b>Статус заказа обновлен!</b>\n"
        f"────────────────────\n"
        f"📦 Заказ: <code>#{order_id}</code>\n"
        f"👤 Клиент: <b>{customer_name}</b>\n"
        f"📊 Новый статус: <b>{status_text}</b>\n"
        f"────────────────────"
    )
    try:
        await TelegramNotificationService().send_worker_alert(int(settings.CHAT_ID), florist_msg)
    except Exception as e:
        logger.error(f"Failed to send status update to general chat: {e}")

    # ── Notification 2: Direct Client Push Alert ─────────────────────────────
    # We query if the customer exists in our telegram_managers (meaning they are in bot)
    # or if we have their chat_id linked. Since the customer is a user, if we find their phone or chat_id, we push.
    # For demonstration, we attempt to find any chat_id in database matching customer phone.
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT chat_id FROM telegram_managers WHERE phone = %s OR username = %s", (phone, customer_name))
                row = await cur.fetchone()
                if row:
                    chat_id = row[0]
                    client_msg = (
                        f"🌸 <b>Планета Цветов</b>\n"
                        f"────────────────────\n"
                        f"Уважаемый(ая) <b>{customer_name}</b>, ваш заказ <code>#{order_id}</code> переведен в статус:\n"
                        f"👉 <b>{status_text}</b>\n"
                        f"────────────────────\n"
                        f"Спасибо, что выбираете нас! ✨"
                    )
                    # Send direct message
                    token = settings.TELEGRAM_BOT_TOKEN
                    url = f"https://api.telegram.org/bot{token}/sendMessage"
                    async with httpx.AsyncClient() as client:
                        await client.post(url, json={"chat_id": chat_id, "text": client_msg, "parse_mode": "HTML"})
                        logger.info("Direct status push sent successfully to customer chat_id=%s", chat_id)
    except Exception as e:
        logger.error(f"Failed to send direct client push: {e}")

@router.get("/{order_id}/receipt")
async def generate_order_receipt(order_id: int, db: AsyncConnection = Depends(get_db)):
    """
    Generates a high-quality PDF receipt/invoice for florists and streams it.
    """
    repo = OrderRepository(db)
    order = await repo.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    # Parse items JSON
    items = []
    if isinstance(order["items"], str):
        items = json.loads(order["items"])
    elif isinstance(order["items"], list):
        items = order["items"]

    # Generate PDF in memory buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#7c3aed") # Premium Violet
    )
    normal_style = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )
    bold_style = ParagraphStyle(
        "InvoiceBold",
        parent=normal_style,
        fontName="Helvetica-Bold"
    )

    story = []
    
    # Header Title
    story.append(Paragraph("PLANETA CVETOV - INVOICE", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Order ID: #{order['id']}", bold_style))
    story.append(Paragraph(f"Date: {order['created_at'].strftime('%d.%m.%Y %H:%M')}", normal_style))
    story.append(Spacer(1, 15))
    
    # Customer Info
    story.append(Paragraph("<b>CUSTOMER INFORMATION:</b>", bold_style))
    story.append(Paragraph(f"Name: {order['customer_name']}", normal_style))
    story.append(Paragraph(f"Phone: {order['phone']}", normal_style))
    if order.get("email"):
        story.append(Paragraph(f"Email: {order['email']}", normal_style))
    story.append(Paragraph(f"Address: {order['address'] or 'Pick-up / Shop'}", normal_style))
    story.append(Spacer(1, 20))
    
    # Table of Items
    table_data = [["Item Description", "Price", "Qty", "Total"]]
    for item in items:
        table_data.append([
            item.get("name", "Custom Bouquet"),
            f"{item.get('price', 0):,.0f} RUB",
            str(item.get("quantity", 1)),
            f"{item.get('line_total', 0):,.0f} RUB"
        ])
        
    table_data.append(["", "", "GRAND TOTAL:", f"{order['total_amount']:,.0f} RUB"])
    
    # Design Table style
    item_table = Table(table_data, colWidths=[280, 80, 50, 100])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('FONTNAME', (2, -1), (3, -1), 'Helvetica-Bold'),
        ('TOPPADDING', (0, -1), (-1, -1), 10),
    ]))
    
    story.append(item_table)
    story.append(Spacer(1, 40))
    story.append(Paragraph("Thank you for your order! Planet of Flowers.", bold_style))
    
    # Build Document
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=receipt_{order_id}.pdf"}
    )

class UpdateCustomOrderRequest(BaseModel):
    price: float = Field(..., gt=0, description="Final price for the custom bouquet")
    item_name: str = Field("Индивидуальный букет под заказ", description="Name/Description of the compiled bouquet")

@router.post("/{order_id}/update-custom")
async def update_custom_order_details(
    order_id: int,
    payload: UpdateCustomOrderRequest,
    background_tasks: BackgroundTasks,
    db: AsyncConnection = Depends(get_db)
):
    try:
        async with db.transaction():
            async with db.cursor(row_factory=dict_row) as cur:
                # 1. Fetch current order to verify it is indeed custom (product_id = 0)
                await cur.execute("SELECT items, customer_name, phone FROM orders WHERE id = %s", (order_id,))
                order = await cur.fetchone()
                if not order:
                    raise HTTPException(status_code=404, detail="Заказ не найден")
                
                items = json.loads(order["items"]) if isinstance(order["items"], str) else order["items"]
                if not items or items[0].get("product_id") != 0:
                    raise HTTPException(status_code=400, detail="Этот заказ не является индивидуальным")
                
                # 2. Update the item price and line total
                items[0]["price"] = payload.price
                items[0]["line_total"] = payload.price
                if payload.item_name:
                    items[0]["name"] = payload.item_name
                
                items_json = json.dumps(items)
                
                # 3. Update orders table
                await cur.execute(
                    "UPDATE orders SET total_amount = %s, items = %s WHERE id = %s",
                    (payload.price, items_json, order_id)
                )
                
                # 4. Log to agent_logs
                details = f"Согласована стоимость инд. букета для {order['customer_name']}: {payload.price} ₽"
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Расчет стоимости", f"Заказ #{order_id}, Сумма: {payload.price} ₽, Состав: {payload.item_name}")
                )
                
        # Send direct push to customer about price agreement!
        client_msg = (
            f"🌸 <b>Планета Цветов</b>\n"
            f"────────────────────\n"
            f"Согласован состав и стоимость вашего индивидуального букета (заказ <code>#{order_id}</code>):\n"
            f"💐 Состав: <b>{payload.item_name}</b>\n"
            f"💰 Стоимость: <b>{payload.price:,.0f} ₽</b>\n"
            f"────────────────────\n"
            f"Наши флористы уже приступили к сборке! ✨"
        )
        background_tasks.add_task(
            send_direct_client_push_message,
            order["phone"],
            order["customer_name"],
            client_msg
        )
        
        return {"status": "success", "message": f"Стоимость индивидуального заказа #{order_id} установлена: {payload.price} ₽"}
    except Exception as e:
        logger.exception("Error updating custom order details")
        raise HTTPException(status_code=500, detail=str(e))

async def send_direct_client_push_message(phone: str, customer_name: str, message: str):
    try:
        from app.core.db import pool
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT chat_id FROM telegram_managers WHERE phone = %s OR username = %s", (phone, customer_name))
                row = await cur.fetchone()
                if row:
                    chat_id = row[0]
                    token = settings.TELEGRAM_BOT_TOKEN
                    url = f"https://api.telegram.org/bot{token}/sendMessage"
                    async with httpx.AsyncClient() as client:
                        await client.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"})
                        logger.info("Direct push alert successfully sent to client for price agreement.")
    except Exception as e:
        logger.error(f"Failed to send direct client push message: {e}")

