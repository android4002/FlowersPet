import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.db import pool

logger = logging.getLogger("flowerspet-telegram-managers-api")
router = APIRouter()

class ManagerResponse(BaseModel):
    id: int
    chat_id: int
    username: str
    role: str
    is_active: bool

class UpdateManagerStatusRequest(BaseModel):
    is_active: bool

@router.get("/", response_model=list[ManagerResponse])
async def list_managers():
    """
    Retrieves all Telegram managers/staff from database.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT id, chat_id, username, role, is_active FROM telegram_managers ORDER BY id")
                rows = await cur.fetchall()
                managers = []
                for row in rows:
                    managers.append({
                        "id": row[0],
                        "chat_id": row[1],
                        "username": row[2] or f"ID {row[1]}",
                        "role": row[3] or "staff",
                        "is_active": row[4]
                    })
                return managers
    except Exception as e:
        logger.exception("Error listing telegram managers")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{chat_id}")
async def update_manager_status(chat_id: int, payload: UpdateManagerStatusRequest):
    """
    Updates the is_active status of a Telegram manager in PostgreSQL.
    """
    try:
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:
                    # Verify manager exists
                    await cur.execute(
                        "SELECT is_active, username FROM telegram_managers WHERE chat_id = %s",
                        (chat_id,)
                    )
                    row = await cur.fetchone()
                    if not row:
                        raise HTTPException(status_code=404, detail="Сотрудник не найден")
                    
                    new_status = payload.is_active
                    username = row[1] or f"ID {chat_id}"
                    
                    # Update status
                    await cur.execute(
                        "UPDATE telegram_managers SET is_active = %s WHERE chat_id = %s",
                        (new_status, chat_id)
                    )
                    
                    # Log action to agent_logs
                    action_text = f"Забанил сотрудника @{username}" if not new_status else f"Разблокировал сотрудника @{username}"
                    await cur.execute(
                        "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                        (1, "Менеджмент персонала", f"Chat ID: {chat_id}, Новый статус: {new_status}")
                    )
                    
                    logger.info("AdminAction: Updated status for chat_id=%s. New is_active: %s", chat_id, new_status)
                    return {"status": "success", "chat_id": chat_id, "is_active": new_status}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating status for manager chat_id=%s", chat_id)
        raise HTTPException(status_code=500, detail=str(e))
