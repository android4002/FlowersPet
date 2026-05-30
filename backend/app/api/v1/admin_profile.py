import logging
from fastapi import APIRouter, Depends, HTTPException
from psycopg import AsyncConnection
from psycopg.rows import dict_row
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.db import get_db

logger = logging.getLogger("flowerspet-api-profile")
router = APIRouter()

USER_ID = 1  # single-admin system, no auth yet


class ProfileUpdateSchema(BaseModel):
    full_name: str
    email: EmailStr
    phone: str


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


@router.get("/")
async def get_profile(db: AsyncConnection = Depends(get_db)):
    async with db.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            "SELECT id, username, email, full_name, phone, is_superuser, created_at FROM users WHERE id = %s",
            (USER_ID,)
        )
        user = await cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Профиль не найден")
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"] or user["username"],
            "phone": user["phone"] or "",
            "is_superuser": user["is_superuser"],
            "created_at": user["created_at"].isoformat() if user["created_at"] else None,
        }


@router.put("/")
async def update_profile(
    payload: ProfileUpdateSchema,
    db: AsyncConnection = Depends(get_db)
):
    async with db.transaction():
        async with db.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                UPDATE users
                SET full_name = %s, email = %s, phone = %s
                WHERE id = %s
                RETURNING id, username, email, full_name, phone
                """,
                (payload.full_name, payload.email, payload.phone, USER_ID)
            )
            user = await cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="Профиль не найден")
            logger.info(f"Profile updated for user id={USER_ID}")
            return {"success": True, "profile": user}


@router.post("/change-password")
async def change_password(
    payload: PasswordChangeSchema,
    db: AsyncConnection = Depends(get_db)
):
    async with db.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            "SELECT password_hash FROM users WHERE id = %s",
            (USER_ID,)
        )
        user = await cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Plain-text comparison (no hashing yet — matches existing system)
        if user["password_hash"] != payload.current_password:
            raise HTTPException(status_code=400, detail="Неверный текущий пароль")

        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="Новый пароль должен быть не менее 8 символов")

    async with db.transaction():
        async with db.cursor() as cur:
            await cur.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (payload.new_password, USER_ID)
            )
    logger.info(f"Password changed for user id={USER_ID}")
    return {"success": True, "message": "Пароль успешно изменён"}
