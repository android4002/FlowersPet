import logging
from psycopg import AsyncConnection
from psycopg.rows import dict_row

logger = logging.getLogger("flowerspet-manager-repo")


class ManagerRepository:
    """
    Repository for read access to the `telegram_managers` table.
    All DB operations are performed through an externally provided AsyncConnection,
    which is injected from the connection pool by the service layer.
    """

    def __init__(self, conn: AsyncConnection) -> None:
        self._conn = conn

    async def get_by_chat_id(self, chat_id: int) -> dict | None:
        """
        Fetches a single TelegramManager record by Telegram chat_id.

        Args:
            chat_id: The Telegram chat identifier (equals user_id for private chats).

        Returns:
            A dict with keys (id, chat_id, username, is_active, role) or None
            if no matching record exists.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT id, chat_id, username, is_active, role
                FROM telegram_managers
                WHERE chat_id = %s
                """,
                (chat_id,),
            )
            result = await cur.fetchone()
            if result:
                logger.debug(
                    "ManagerRepository: found manager chat_id=%s role=%s",
                    chat_id,
                    result.get("role"),
                )
            else:
                logger.debug(
                    "ManagerRepository: no manager found for chat_id=%s", chat_id
                )
            return result
