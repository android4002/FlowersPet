"""
handlers/manager_bot.py
=======================
Aiogram v3 router for the FlowersPET manager Telegram bot.

Architecture:
  ┌────────────────────────────────────────────┐
  │  FastAPI lifespan  ──►  dp.start_polling() │
  └────────────────────────────────────────────┘
          │
  ManagerAuthMiddleware  (message-level, registered on dp)
          │  checks TelegramManager.chat_id + is_active via pool
          │  injects `manager` dict into handler data
          ▼
  Router handlers
    /start        → greeting + role
    /status       → active orders today
    /report_daily → aggregated daily report
"""

import logging
from datetime import date
from typing import Any, Awaitable, Callable

from aiogram import Bot, Dispatcher, Router, BaseMiddleware, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import Message, TelegramObject

from app.core.config import settings
from app.core.db import pool
from app.features.telegram.services.manager_bot_service import ManagerBotService
from app.features.telegram.keyboards import get_main_menu_keyboard
from app.features.telegram.handlers.admin_panel import admin_router

logger = logging.getLogger("flowerspet-manager-bot")

# ─────────────────────────────────────────────────────────────────────────────
# Bot & Dispatcher
# ─────────────────────────────────────────────────────────────────────────────

bot = Bot(
    token=settings.TELEGRAM_BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML),
)
dp = Dispatcher()
router = Router(name="manager_bot")

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

ROLE_LABELS: dict[str, str] = {
    "florist": "🌸 Флорист",
    "courier": "🚚 Курьер",
    "admin": "👑 Администратор",
    "manager": "📋 Менеджер",
    "senior_florist": "🌺 Старший флорист",
}

DENIED_TEXT = (
    "🚫 <b>Доступ запрещён.</b>\n\n"
    "Ваш аккаунт не зарегистрирован в системе или деактивирован.\n"
    "Обратитесь к администратору."
)

# ─────────────────────────────────────────────────────────────────────────────
# Middleware: Manager Authentication
# ─────────────────────────────────────────────────────────────────────────────


class ManagerAuthMiddleware(BaseMiddleware):
    """
    Message-level middleware that verifies the sender is a registered,
    active manager before any handler processes the command.

    Flow:
      1. Extract from_user.id from the incoming Message.
      2. Open a short-lived connection from the pool.
      3. Call ManagerBotService.authenticate_manager(chat_id).
      4a. If denied → reply "Доступ запрещён" and halt (return without calling handler).
      4b. If allowed → inject `manager` dict into handler data and continue.
    """

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        # Guard: skip non-user messages (e.g. channel posts without sender)
        if not event.from_user:
            logger.debug("ManagerAuthMiddleware: skipping message without from_user")
            return

        chat_id: int = event.from_user.id

        async with pool.connection() as conn:
            service = ManagerBotService(conn)
            manager = await service.authenticate_manager(chat_id)

        if manager is None:
            logger.warning(
                "ManagerAuthMiddleware: DENIED chat_id=%s username=%s",
                chat_id,
                event.from_user.username,
            )
            await event.answer(DENIED_TEXT)
            return  # ← halt: handler is NOT called

        logger.info(
            "ManagerAuthMiddleware: ALLOWED chat_id=%s role=%s",
            chat_id,
            manager["role"],
        )
        data["manager"] = manager
        return await handler(event, data)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _today_label() -> str:
    """Returns today's date formatted as DD.MM.YYYY (display use only)."""
    return date.today().strftime("%d.%m.%Y")


def _role_label(role: str) -> str:
    """Returns a human-readable Russian role label with emoji."""
    return ROLE_LABELS.get(role, f"🔖 {role.replace('_', ' ').capitalize()}")


# ─────────────────────────────────────────────────────────────────────────────
# Handler: /start
# ─────────────────────────────────────────────────────────────────────────────


@router.message(Command("start"))
async def cmd_start(message: Message, manager: dict) -> None:
    """
    /start — Welcome message displaying the manager's registered role.
    """
    # Step 1: display name
    username_display = (
        f"@{manager['username']}" if manager.get("username") else "менеджер"
    )

    # Step 2: role label
    role_label = _role_label(manager["role"])

    # Step 3: compose message
    text = (
        f"👋 Добро пожаловать, <b>{username_display}</b>!\n\n"
        f"🏷 Ваша роль: <b>{role_label}</b>\n\n"
        f"Используйте кнопки меню внизу экрана для быстрого доступа к функциям."
    )
    await message.answer(text, reply_markup=get_main_menu_keyboard(manager["role"]))
    logger.info("cmd_start: served to chat_id=%s", message.from_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# Handler: /status
# ─────────────────────────────────────────────────────────────────────────────


@router.message(Command("status"))
@router.message(F.text == "📦 Статус заказов")
async def cmd_status(message: Message, manager: dict) -> None:
    """
    /status — Outputs the number of active (non-cancelled) orders for today.
    """
    # Step 1: fetch count
    async with pool.connection() as conn:
        service = ManagerBotService(conn)
        count = await service.get_active_orders_today()

    # Step 2: emoji hint
    emoji = "📦" if count > 0 else "📭"

    # Step 3: format response
    text = (
        f"{emoji} <b>Статус заказов — {_today_label()}</b>\n\n"
        f"Активных заказов: <code>{count}</code>\n"
        f"<i>(учитываются статусы: pending, processing, ready)</i>"
    )
    await message.answer(text)
    logger.info("cmd_status: count=%s served to chat_id=%s", count, message.from_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# Handler: /report_daily
# ─────────────────────────────────────────────────────────────────────────────


@router.message(Command("report_daily"))
@router.message(F.text == "📊 Дневной отчёт")
async def cmd_report_daily(message: Message, manager: dict) -> None:
    """
    /report_daily — Aggregated daily business report.
    """
    # Step 1: fetch data
    async with pool.connection() as conn:
        service = ManagerBotService(conn)
        report = await service.get_daily_report()

    revenue: float = report["revenue"]
    standard_count: int = report["standard_count"]
    custom_count: int = report["custom_count"]
    top_products: list[dict] = report["top_products"]

    # Step 2: totals
    total_orders = standard_count + custom_count

    # Step 3: top products block
    if top_products:
        top_lines = "\n".join(
            f"  <b>{i + 1}.</b> {p['product_name']} — "
            f"<code>{p['total_qty']}</code> шт. "
            f"(<i>{p['total_revenue']:,.0f} ₽</i>)"
            for i, p in enumerate(top_products)
        )
    else:
        top_lines = "  <i>Продаж по позициям пока нет</i>"

    # Step 4: assemble report
    divider = "━" * 26
    text = (
        f"📊 <b>Дневной отчёт</b> — <code>{_today_label()}</code>\n"
        f"{divider}\n\n"
        f"💰 <b>Выручка:</b>  <code>{revenue:,.0f} ₽</code>\n\n"
        f"📋 <b>Заказы:</b>  <code>{total_orders}</code> всего\n"
        f"  • Стандартных:    <code>{standard_count}</code>\n"
        f"  • Индивидуальных: <code>{custom_count}</code>\n\n"
        f"🏆 <b>Топ-5 позиций:</b>\n"
        f"{top_lines}"
    )

    # Step 5: send
    await message.answer(text)
    logger.info(
        "cmd_report_daily: revenue=%.2f orders=%d served to chat_id=%s",
        revenue,
        total_orders,
        message.from_user.id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Register middleware and routers on the dispatcher
# ─────────────────────────────────────────────────────────────────────────────

dp.message.middleware(ManagerAuthMiddleware())
dp.include_router(admin_router)
dp.include_router(router)


