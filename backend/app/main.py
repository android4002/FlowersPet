import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.exc import OperationalError, DBAPIError
from aiogram.types import Update

from app.core.config import settings
from app.core.db import pool

# Create SQLAlchemy engine at module level so SQLAdmin can use it at import time
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_async_engine(db_url, echo=False)
from app.api.v1.products import router as products_router
from app.api.v1.orders import router as orders_router
from app.api.v1.admin_staff import router as admin_staff_router
from app.api.v1.admin_orders import router as admin_orders_router
from app.api.v1.telegram_managers import router as telegram_managers_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin_profile import router as admin_profile_router
from app.admin.auth import AdminAuth
from app.admin.views import UserAdmin, AgentLogAdmin, TokenTransactionAdmin, DashboardView, ProductAdmin, OrderAdmin, TelegramManagerAdmin
from app.features.telegram.handlers.manager_bot import bot, dp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("flowerspet-backend")

# Lifecycle management for FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("Initializing database connection pool...")

    # Open psycopg connection pool
    await pool.open()
    logger.info("Database connection pool opened successfully.")

    # Automatically create admin tables if they don't exist
    from app.admin.views import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("SQLAlchemy metadata tables verified/created successfully.")
    
     # ── Start Telegram bot (polling mode) ────────────────────────────────────
     # If BOT_WEBHOOK_URL is configured in settings, switch to webhook mode instead.
    _bot_task: asyncio.Task | None = None
    if settings.BOT_WEBHOOK_URL:
        await bot.set_webhook(
            url=settings.BOT_WEBHOOK_URL,
            allowed_updates=dp.resolve_used_update_types(),
            drop_pending_updates=True,
        )
        logger.info("Telegram bot: webhook set → %s", settings.BOT_WEBHOOK_URL)
    else:
        _bot_task = asyncio.create_task(
            dp.start_polling(bot, handle_signals=False, drop_pending_updates=True)
        )
        logger.info("Telegram bot: long-polling started")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    if settings.BOT_WEBHOOK_URL:
        await bot.delete_webhook()
    
    await bot.session.close()
    logger.info("Telegram bot session closed")
    
    logger.info("Closing database connection pool...")
    try:
        await pool.close()
        await engine.dispose()
        logger.info("Database connection pool closed successfully.")
    except Exception as e:
        logger.error(f"Error while closing database connection pool: {e}")


# Initialize Admin Authentication Backend using application's SECRET_KEY
authentication_backend = AdminAuth(secret_key=settings.SECRET_KEY)

app = FastAPI(
    title="FlowersPET API",
    description="Backend API service for the FlowersPET store.",
    version="1.0.0",
    lifespan=lifespan
)

# Initialize SQLAdmin panel with robust PostgreSQL operational error handling
try:
    admin = Admin(app, engine, templates_dir="app/templates", authentication_backend=authentication_backend)
    
    # Register admin panel model and base views
    admin.add_view(UserAdmin)
    admin.add_view(AgentLogAdmin)
    admin.add_view(TokenTransactionAdmin)
    admin.add_view(ProductAdmin)
    admin.add_view(OrderAdmin)
    admin.add_view(TelegramManagerAdmin)
    admin.add_view(DashboardView)
    
    logger.info("SQLAdmin panel, ModelViews, and Custom Dashboard successfully initialized.")
except (OperationalError, DBAPIError) as db_err:
    logger.critical(f"PostgreSQL connection failure while initializing SQLAdmin: {db_err}")
except Exception as e:
    logger.critical(f"Unexpected error initializing SQLAdmin panel: {e}")

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(admin_staff_router, prefix="/api/v1/admin/staff", tags=["Admin Staff"])
app.include_router(admin_orders_router, prefix="/api/v1/admin/orders", tags=["Admin Orders"])
app.include_router(telegram_managers_router, prefix="/api/v1/telegram/managers", tags=["Telegram Managers"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin_profile_router, prefix="/api/v1/admin/profile", tags=["Admin Profile"])

@app.get("/", tags=["Health Check"])
async def root():
    logger.info("Root health check endpoint hit")
    return {
        "status": "ok",
        "service": "FlowersPET API Backend",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "database": "connected" if not pool.closed else "disconnected"
    }

@app.post("/bot/webhook", include_in_schema=False)
async def bot_webhook(request: Request) -> Response:
    """
    Telegram webhook endpoint (active only when BOT_WEBHOOK_URL is configured).
    Receives raw JSON from Telegram, parses it into an aiogram Update,
    and feeds it to the dispatcher for handler processing.
    """
    update = Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return Response()
