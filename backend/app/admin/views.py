from datetime import datetime
from typing import List

from sqladmin import ModelView, BaseView, expose
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

# Base declarative for admin models
Base = declarative_base()

from app.features.telegram.models.telegram_user import TelegramManager

# === Auth & Mock Database Models ===

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    agent_logs = relationship("AgentLog", back_populates="user", cascade="all, delete-orphan")
    token_transactions = relationship("TokenTransaction", back_populates="user", cascade="all, delete-orphan")

class AgentLog(Base):
    __tablename__ = "admin_action_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)
    user = relationship("User", back_populates="agent_logs")

class TokenTransaction(Base):
    __tablename__ = "token_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="token_transactions")

# === Real Database Models (Aligned with PostgreSQL DDL) ===

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    discount_price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(Text, nullable=True)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    rating = Column(Numeric(2, 1), default=4.8)
    reviews_count = Column(Integer, default=10)
    images = Column(JSON, nullable=True)
    details = Column(JSON, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    items = Column(JSON, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

# === SQLAdmin ModelViews ===

from sqladmin.filters import BooleanFilter, OperationColumnFilter

class UserAdmin(ModelView, model=User):
    name = "Пользователь"
    name_plural = "Пользователи"
    icon = "fa-solid fa-user"
    column_list = ["id", "username", "email", "is_superuser", "created_at"]
    column_searchable_list = ["username", "email"]
    column_filters = [BooleanFilter(User.is_superuser), OperationColumnFilter(User.created_at)]
    column_default_sort = [("created_at", True)]
    column_labels = {
        "id": "ID",
        "username": "Имя пользователя",
        "email": "Email адрес",
        "password_hash": "Хэш пароля",
        "is_superuser": "Администратор",
        "created_at": "Дата регистрации"
    }
    page_size = 25

class AgentLogAdmin(ModelView, model=AgentLog):
    name = "Лог действий"
    name_plural = "Логи действий"
    icon = "fa-solid fa-file-alt"
    column_list = ["id", "user_id", "action", "timestamp"]
    column_searchable_list = ["action", "details"]
    column_filters = [OperationColumnFilter(AgentLog.user_id), OperationColumnFilter(AgentLog.timestamp)]
    column_labels = {
        "id": "ID",
        "user_id": "ID Пользователя",
        "action": "Действие",
        "timestamp": "Время операции",
        "details": "Детали действия"
    }
    page_size = 50

class TokenTransactionAdmin(ModelView, model=TokenTransaction):
    name = "Транзакция токенов"
    name_plural = "Транзакции токенов"
    icon = "fa-solid fa-coins"
    column_list = ["id", "user_id", "amount", "created_at"]
    column_filters = [OperationColumnFilter(TokenTransaction.user_id), OperationColumnFilter(TokenTransaction.created_at)]
    column_labels = {
        "id": "ID",
        "user_id": "ID Пользователя",
        "amount": "Сумма токенов",
        "created_at": "Дата транзакции"
    }
    page_size = 50

class ProductAdmin(ModelView, model=Product):
    name = "Товар"
    name_plural = "Товары"
    icon = "fa-solid fa-box-open"
    column_list = ["id", "name", "price", "discount_price", "stock", "is_active"]
    column_searchable_list = ["name", "description"]
    column_filters = [OperationColumnFilter(Product.price), OperationColumnFilter(Product.stock), BooleanFilter(Product.is_active)]
    form_columns = [
        "category_id", "name", "description", "price", 
        "discount_price", "image_url", "stock", "is_active", 
        "rating", "reviews_count", "images", "details"
    ]
    column_labels = {
        "id": "ID",
        "category_id": "ID Категории",
        "name": "Название букета",
        "description": "Описание",
        "price": "Базовая цена (₽)",
        "discount_price": "Цена со скидкой (₽)",
        "image_url": "Изображение (URL)",
        "stock": "Остаток на складе",
        "is_active": "Отображать на сайте",
        "rating": "Рейтинг",
        "reviews_count": "Количество отзывов",
        "images": "Галерея картинок (JSON)",
        "details": "Детали / Характеристики (JSON)"
    }
    page_size = 30

class OrderAdmin(ModelView, model=Order):
    name = "Заказ"
    name_plural = "Заказы"
    icon = "fa-solid fa-receipt"
    column_list = ["id", "customer_name", "phone", "total_amount", "status", "created_at"]
    column_searchable_list = ["customer_name", "phone", "email"]
    column_filters = [OperationColumnFilter(Order.status), OperationColumnFilter(Order.created_at)]
    column_default_sort = [("created_at", True)]
    form_columns = ["customer_name", "phone", "email", "address", "total_amount", "items", "status"]
    column_labels = {
        "id": "ID",
        "customer_name": "Имя клиента",
        "phone": "Номер телефона",
        "email": "Email клиента",
        "address": "Адрес доставки",
        "total_amount": "Итоговая сумма (₽)",
        "items": "Содержимое заказа (JSON)",
        "status": "Статус заказа",
        "created_at": "Дата оформления"
    }
    page_size = 30

class TelegramManagerAdmin(ModelView, model=TelegramManager):
    name = "Сотрудник Telegram"
    name_plural = "Сотрудники Telegram"
    icon = "fa-solid fa-users-cog"
    column_list = ["id", "chat_id", "username", "role", "is_active"]
    column_searchable_list = ["username"]
    column_filters = [OperationColumnFilter(TelegramManager.role), BooleanFilter(TelegramManager.is_active)]
    form_columns = ["chat_id", "username", "role", "is_active"]
    column_labels = {
        "id": "ID",
        "chat_id": "Telegram Chat ID",
        "username": "Имя пользователя TG",
        "role": "Системная роль",
        "is_active": "Доступ активен"
    }
    page_size = 20

# === Custom Dashboard View ===

class DashboardView(BaseView):
    name = "Панель управления"
    icon = "fa-solid fa-chart-line"

    @expose("/dashboard", methods=["GET"])
    async def render_dashboard(self, request):
        from app.main import engine
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy import text
        async with AsyncSession(engine) as session:
            stats = {
                "users": await session.execute(text("SELECT COUNT(*) FROM users")),
                "orders": await session.execute(text("SELECT COUNT(*) FROM orders")),
                "transactions": await session.execute(text("SELECT COUNT(*) FROM token_transactions")),
            }
            return await self.templates.TemplateResponse(
                request,
                "admin/dashboard.html",
                {"stats": stats},
            )
