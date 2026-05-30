import logging
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from psycopg import AsyncConnection
from psycopg.rows import dict_row
from app.core.db import get_db
from app.core.config import settings
from app.schemas.order import OrderCreateSchema, CustomOrderCreateSchema
from app.features.telegram.services.notification import TelegramNotificationService

logger = logging.getLogger("flowerspet-api-orders")
router = APIRouter()

@router.post("/", status_code=201)
async def create_order(
    payload: OrderCreateSchema,
    background_tasks: BackgroundTasks,
    db: AsyncConnection = Depends(get_db)
):
    """
    Creates a new order in the database within a transaction block.
    Verifies stock, updates stock, writes order, and triggers Telegram notification as background task.
    """
    logger.info(f"Order Creation: Initiating transaction for customer {payload.customer_name}")
    
    try:
        # Explicit transaction context ensures all commands are executed within a single transaction
        # and automatically rolled back if an error occurs.
        async with db.transaction():
            async with db.cursor(row_factory=dict_row) as cur:
                
                total_amount = 0.0
                resolved_items = []
                items_summary_lines = []
                
                # Check each item in order
                for item in payload.items:
                    # Select item with FOR UPDATE row-level lock to prevent concurrent checkout race conditions
                    await cur.execute(
                        """
                        SELECT id, name, price, discount_price, stock, is_active 
                        FROM products 
                        WHERE id = %s 
                        FOR UPDATE
                        """,
                        (item.product_id,)
                    )
                    product = await cur.fetchone()
                    
                    if not product:
                        logger.warning(f"Order Creation Failed: Product #{item.product_id} not found.")
                        raise HTTPException(
                            status_code=404, 
                            detail=f"Товар с ID {item.product_id} не найден"
                        )
                    
                    if not product["is_active"]:
                        logger.warning(f"Order Creation Failed: Product '{product['name']}' is inactive.")
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Товар '{product['name']}' недоступен для заказа"
                        )
                        
                    if product["stock"] < item.quantity:
                        logger.warning(f"Order Creation Failed: Insufficient stock for '{product['name']}'. Available: {product['stock']}")
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Недостаточно товара '{product['name']}' на складе. Доступно всего {product['stock']} шт."
                        )
                    
                    # Determine active price (handling discount)
                    price = float(product["price"])
                    if product["discount_price"] is not None and float(product["discount_price"]) < price:
                        price = float(product["discount_price"])
                        
                    line_total = price * item.quantity
                    total_amount += line_total
                    
                    # Update stock
                    new_stock = product["stock"] - item.quantity
                    await cur.execute(
                        "UPDATE products SET stock = %s WHERE id = %s",
                        (new_stock, item.product_id)
                    )
                    
                    # Record snapshot
                    resolved_items.append({
                        "product_id": product["id"],
                        "name": product["name"],
                        "price": price,
                        "quantity": item.quantity,
                        "line_total": line_total
                    })
                    
                    items_summary_lines.append(f"• {product['name']} x{item.quantity} — {line_total:,.0f} ₽")
                
                # Insert order into orders table
                items_json = json.dumps(resolved_items)
                await cur.execute(
                    """
                    INSERT INTO orders (customer_name, phone, email, address, total_amount, items, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                    RETURNING id, created_at
                    """,
                    (
                        payload.customer_name,
                        payload.phone,
                        payload.email,
                        payload.address,
                        total_amount,
                        items_json
                    )
                )
                order = await cur.fetchone()
                order_id = order["id"]
                logger.info(f"Order Creation Success: Order #{order_id} created successfully for {payload.customer_name}.")
                
        # Outside of the transaction, schedule Telegram notification concurrently.
        # BackgroundTasks ensures a Telegram API failure never blocks the client response.
        items_summary = "\n".join(items_summary_lines)
        _tg_message: str = (
            f"🛍 <b>Новый заказ!</b>\n"
            f"Номер: <code>{order_id}</code>\n"
            f"Сумма: {total_amount} руб.\n"
            f"Состав: {items_summary}"
        )
        try:
            chat_id = int(settings.CHAT_ID)
            background_tasks.add_task(
                TelegramNotificationService().send_worker_alert,
                chat_id,
                _tg_message,
            )
        except (ValueError, TypeError):
            logger.warning("CHAT_ID not configured — Telegram notification skipped")
        
        return {
            "success": True,
            "order_id": order_id,
            "total_amount": total_amount,
            "message": "Заказ успешно оформлен"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Critical error during order creation")
        raise HTTPException(
            status_code=500,
            detail="Произошла внутренняя ошибка сервера при оформлении заказа"
        )

@router.post("/custom", status_code=201)
async def create_custom_order(
    payload: CustomOrderCreateSchema,
    background_tasks: BackgroundTasks,
    db: AsyncConnection = Depends(get_db)
):
    """
    Creates a new custom/individual order request in the database.
    Re-uses standard orders table structure for seamless notification and tracking.
    """
    logger.info(f"Custom Order Creation: Initiating request for customer {payload.customer_name}")
    
    try:
        async with db.transaction():
            async with db.cursor(row_factory=dict_row) as cur:
                # Custom order details summary
                details_text = f"Индивидуальный заказ. Повод: {payload.occasion}. Бюджет: {payload.budget}."
                if payload.colors:
                    details_text += f" Предпочтительные цвета: {', '.join(payload.colors)}."
                
                # Mocked item structure for custom orders
                resolved_items = [{
                    "product_id": 0,
                    "name": "Индивидуальный букет под заказ",
                    "price": 0.0,
                    "quantity": 1,
                    "line_total": 0.0,
                    "occasion": payload.occasion,
                    "budget": payload.budget,
                    "colors": payload.colors,
                    "wishes": payload.wishes or ""
                }]
                items_json = json.dumps(resolved_items)
                
                # Insert order into standard orders table
                await cur.execute(
                    """
                    INSERT INTO orders (customer_name, phone, email, address, total_amount, items, status)
                    VALUES (%s, %s, %s, %s, 0.0, %s, 'pending')
                    RETURNING id, created_at
                    """,
                    (
                        payload.customer_name,
                        payload.phone,
                        None,
                        details_text,
                        items_json
                    )
                )
                order = await cur.fetchone()
                order_id = order["id"]
                logger.info(f"Custom Order Success: Custom order #{order_id} recorded.")
                
        # Outside of the transaction, schedule Telegram notification concurrently.
        colors_summary: str = ", ".join(payload.colors) if payload.colors else "Любые"
        wishes_text: str = payload.wishes or "Нет особых пожеланий"

        _tg_description: str = (
            f"Повод: {payload.occasion}. Бюджет: {payload.budget}. "
            f"Цвета: {colors_summary}. Пожелания: {wishes_text}"
        )
        _tg_message: str = (
            f"✨ <b>Заявка на индивидуальный букет!</b>\n"
            f"ID: {order_id}\n"
            f"Параметры: {_tg_description}"
        )
        try:
            chat_id = int(settings.CHAT_ID)
            background_tasks.add_task(
                TelegramNotificationService().send_worker_alert,
                chat_id,
                _tg_message,
            )
        except (ValueError, TypeError):
            logger.warning("CHAT_ID not configured — Telegram notification skipped")

        return {
            "success": True,
            "order_id": order_id,
            "message": "Заявка на индивидуальный заказ успешно принята! Наш флорист свяжется с вами в течение 10 минут."
        }
        
    except Exception as e:
        logger.exception("Critical error during custom order creation")
        raise HTTPException(
            status_code=500,
            detail="Произошла внутренняя ошибка сервера при оформлении индивидуального заказа"
        )
