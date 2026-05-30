import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.db import pool

logger = logging.getLogger("flowerspet-admin-staff-api")
router = APIRouter()

@router.get("/")
async def list_staff():
    """
    Returns a list of all Telegram managers/staff from database.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT id, chat_id, username, role, is_active FROM telegram_managers ORDER BY id")
                rows = await cur.fetchall()
                staff = []
                for row in rows:
                    staff.append({
                        "id": str(row[0]),
                        "chat_id": row[1],
                        "username": row[2] or f"ID {row[1]}",
                        "role": row[3] or "Сотрудник",
                        "is_active": row[4],
                        "last_activity": "Активен" if row[4] else "Заблокирован"
                    })
                return staff
    except Exception as e:
        logger.exception("Error listing staff")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def list_logs():
    """
    Returns admin action logs from agent_logs table.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT l.id, l.timestamp, u.username, l.action, l.details "
                    "FROM admin_action_logs l LEFT JOIN users u ON l.user_id = u.id "
                    "ORDER BY l.timestamp DESC LIMIT 100"
                )
                rows = await cur.fetchall()
                logs = []
                for row in rows:
                    logs.append({
                        "id": str(row[0]),
                        "timestamp": row[1].isoformat() if row[1] else "",
                        "admin_name": row[2] or "Система/Админ",
                        "action": row[3],
                        "details": row[4] or ""
                    })
                return logs
    except Exception as e:
        logger.exception("Error listing logs")
        raise HTTPException(status_code=500, detail=str(e))

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Message text to send to the staff member")

class ToggleStatusResponse(BaseModel):
    chat_id: int
    is_active: bool
    status: str

class SendMessageResponse(BaseModel):
    chat_id: int
    status: str
    telegram_response: dict

@router.post("/{chat_id}/toggle", response_model=ToggleStatusResponse)
async def toggle_staff_status(chat_id: int):
    """
    Toggles the is_active status of a Telegram manager in PostgreSQL.
    Instantly blocks/allows access in the bot's ManagerAuthMiddleware.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Get current status
                await cur.execute(
                    "SELECT is_active, username FROM telegram_managers WHERE chat_id = %s",
                    (chat_id,)
                )
                row = await cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Сотрудник не найден")
                
                current_status = row[0]
                new_status = not current_status
                username = row[1] or f"ID {chat_id}"
                
                # Update status
                await cur.execute(
                    "UPDATE telegram_managers SET is_active = %s WHERE chat_id = %s",
                    (new_status, chat_id)
                )
                
                # Log action to agent_logs
                # We log to agent_logs using user_id = 1 (default admin account ID)
                action_text = f"Забанил сотрудника @{username}" if not new_status else f"Разблокировал сотрудника @{username}"
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Менеджмент персонала", f"Chat ID: {chat_id}, Новый статус: {new_status}")
                )
                
                logger.info("AdminAction: Toggled status for chat_id=%s. New is_active: %s", chat_id, new_status)
                return ToggleStatusResponse(chat_id=chat_id, is_active=new_status, status="success")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error toggling status for staff chat_id=%s", chat_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{chat_id}/message", response_model=SendMessageResponse)
async def send_message_to_staff(chat_id: int, payload: SendMessageRequest):
    """
    Sends a direct text message to a staff member in Telegram via Bot API sendMessage.
    Uses async httpx client for high performance.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    # Form request payload
    tg_payload = {
        "chat_id": chat_id,
        "text": f"✉️ <b>Сообщение от администрации сайта:</b>\n────────────────────\n{payload.message}\n────────────────────",
        "parse_mode": "HTML"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=tg_payload, timeout=10.0)
            res_data = res.json()
            
            if res.status_code != 200 or not res_data.get("ok"):
                logger.error("Failed to send telegram message to chat_id=%s: %s", chat_id, res_data)
                raise HTTPException(
                    status_code=400, 
                    detail=f"Telegram API Error: {res_data.get('description', 'Unknown error')}"
                )
                
            logger.info("Telegram push message successfully sent to chat_id=%s", chat_id)
            return SendMessageResponse(chat_id=chat_id, status="success", telegram_response=res_data)
    except httpx.RequestError as req_err:
        logger.exception("Network error communicating with Telegram Bot API")
        raise HTTPException(status_code=502, detail=f"Network error communicating with Telegram: {req_err}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error sending push message to chat_id=%s", chat_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/broadcast")
async def broadcast_message(payload: SendMessageRequest, background_tasks: BackgroundTasks):
    """
    Sends a text message to all active staff members in Telegram.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT chat_id, username FROM telegram_managers WHERE is_active = TRUE")
                rows = await cur.fetchall()
                
        if not rows:
            return {"status": "success", "message": "Нет активных сотрудников для рассылки"}
            
        async def send_to_one(chat_id: int, username: str):
            tg_payload = {
                "chat_id": chat_id,
                "text": f"📢 <b>Объявление от администрации:</b>\n────────────────────\n{payload.message}\n────────────────────",
                "parse_mode": "HTML"
            }
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(url, json=tg_payload, timeout=10.0)
            except Exception as e:
                logger.error(f"Failed broadcast to chat_id={chat_id}: {e}")
                
        for row in rows:
            background_tasks.add_task(send_to_one, row[0], row[1] or str(row[0]))
            
        return {"status": "success", "message": f"Рассылка запланирована для {len(rows)} сотрудников"}
    except Exception as e:
        logger.exception("Error during staff broadcasting")
        raise HTTPException(status_code=500, detail=str(e))

