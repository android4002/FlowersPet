import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("flowerspet-telegram-service")

async def send_telegram_notification(
    order_id: int, 
    customer_name: str, 
    phone: str, 
    total_amount: float, 
    items_summary: str
) -> None:
    """
    Sends an asynchronous HTML-formatted notification about a new order to the Telegram chat.
    """
    # Safeguard check to verify token is set and valid
    if not settings.TELEGRAM_TOKEN or settings.TELEGRAM_TOKEN == "your_telegram_bot_token_here" or settings.TELEGRAM_TOKEN == "token":
        logger.warning(f"Telegram notification skipped for order #{order_id}: TELEGRAM_TOKEN is not configured.")
        return

    # Formatting text using HTML tags supported by Telegram
    text = (
        f"<b>🌸 Новая покупка на «Планете цветов»!</b>\n\n"
        f"<b>🆔 Заказ:</b> <code>#{order_id}</code>\n"
        f"<b>👤 Клиент:</b> {customer_name}\n"
        f"<b>📞 Телефон:</b> {phone}\n\n"
        f"<b>📦 Состав заказа:</b>\n"
        f"{items_summary}\n\n"
        f"<b>💰 Итого к оплате:</b> <b>{total_amount:,.2f} ₽</b>\n\n"
        f"<i>👉 Пожалуйста, свяжитесь с клиентом для подтверждения заказа.</i>"
    )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Sending Telegram notification for order #{order_id}...")
            response = await client.post(url, json=payload, timeout=10.0)
            
            if response.status_code == 200:
                logger.info(f"Telegram notification sent successfully for order #{order_id}")
            else:
                logger.error(f"Failed to send Telegram notification (status {response.status_code}): {response.text}")
    except Exception as e:
        logger.error(f"Network error while sending Telegram notification: {e}")
