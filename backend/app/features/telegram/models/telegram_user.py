from sqlalchemy import Column, BigInteger, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.admin.views import Base

class TelegramManager(Base):
    __tablename__ = "telegram_managers"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    chat_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "florist", "courier", "admin"
