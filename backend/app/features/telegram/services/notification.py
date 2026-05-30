import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("flowerspet-telegram-notification")

class TelegramNotificationService:
    """
    Asynchronous notification service for communicating with Telegram Bot API
    to send alerts and order updates.
    """
    
    def __init__(self) -> None:
        self.token: str = settings.TELEGRAM_BOT_TOKEN
        self.api_url: str = f"https://api.telegram.org/bot{self.token}/sendMessage"

    async def send_worker_alert(self, chat_id: int, message: str) -> bool:
        """
        Sends an asynchronous alert message to a specific Telegram chat_id 
        using ParseMode.HTML.
        
        Args:
            chat_id (int): The target telegram chat identifier.
            message (str): The HTML formatted text message to send.
            
        Returns:
            bool: True if the message was sent successfully, False otherwise.
        """
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        
        logger.info(f"Attempting to send Telegram alert to chat_id={chat_id}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.api_url, json=payload)
                response.raise_for_status()
                
                result_json = response.json()
                if result_json.get("ok"):
                    logger.info(f"Telegram alert successfully sent to chat_id={chat_id}")
                    return True
                else:
                    logger.error(f"Telegram API responded with error: {result_json}")
                    return False
                    
        except httpx.HTTPStatusError as status_err:
            logger.error(
                f"HTTP error occurred while sending Telegram notification to chat_id={chat_id}: "
                f"Status code {status_err.response.status_code}, Response: {status_err.response.text}"
            )
            return False
        except httpx.RequestError as req_err:
            logger.error(
                f"Network request error occurred while sending Telegram notification to chat_id={chat_id}: {req_err}"
            )
            return False
        except Exception as e:
            logger.error(
                f"Unexpected error occurred while sending Telegram notification to chat_id={chat_id}: {e}"
            )
            return False
