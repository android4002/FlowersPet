import logging
from psycopg import AsyncConnection

from app.features.telegram.repositories.manager_repository import ManagerRepository
from app.features.telegram.repositories.order_repository import OrderRepository

from psycopg.rows import dict_row

logger = logging.getLogger("flowerspet-manager-bot-service")


class ManagerBotService:
    """
    Business-logic service for the manager Telegram bot.

    Composes ManagerRepository and OrderRepository. All methods accept
    an externally-provided AsyncConnection so the caller controls the
    connection lifecycle (one connection per request / middleware call).

    Public API:
        authenticate_manager(chat_id) -> dict | None
        get_active_orders_today()     -> int
        get_daily_report()            -> dict
    """

    def __init__(self, conn: AsyncConnection) -> None:
        self._conn = conn
        self._manager_repo = ManagerRepository(conn)
        self._order_repo = OrderRepository(conn)

    async def authenticate_manager(self, chat_id: int) -> dict | None:
        """
        Validates that the given chat_id belongs to a registered, active manager.

        Returns:
            Manager dict (id, chat_id, username, is_active, role) or None
            if the manager does not exist or is_active == False.
        """
        manager = await self._manager_repo.get_by_chat_id(chat_id)
        if not manager:
            logger.warning(
                "ManagerBotService: unknown chat_id=%s — access denied", chat_id
            )
            return None
        if not manager["is_active"]:
            logger.warning(
                "ManagerBotService: chat_id=%s is_active=False — access denied",
                chat_id,
            )
            return None
        return manager

    async def get_active_orders_today(self) -> int:
        """
        Returns the count of non-cancelled orders created today (Moscow TZ).
        """
        return await self._order_repo.count_active_today()

    async def get_daily_report(self) -> dict:
        """
        Returns aggregated daily report: revenue, order breakdown, top products.
        """
        return await self._order_repo.get_daily_report()

    async def get_all_products(self) -> list[dict]:
        """
        Returns all products for administration.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT id, name, price, discount_price, stock, is_active FROM products ORDER BY id"
            )
            return await cur.fetchall()

    async def get_product_by_id(self, product_id: int) -> dict | None:
        """
        Returns a single product by ID.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT id, name, price, discount_price, stock, is_active FROM products WHERE id = %s",
                (product_id,),
            )
            return await cur.fetchone()

    async def update_product_price(self, product_id: int, price: float) -> None:
        """
        Updates product price.
        """
        async with self._conn.cursor() as cur:
            await cur.execute(
                "UPDATE products SET price = %s WHERE id = %s",
                (price, product_id),
            )

    async def update_product_discount_price(self, product_id: int, discount_price: float | None) -> None:
        """
        Updates product discount price.
        """
        async with self._conn.cursor() as cur:
            await cur.execute(
                "UPDATE products SET discount_price = %s WHERE id = %s",
                (discount_price, product_id),
            )

    async def update_product_stock(self, product_id: int, stock: int) -> None:
        """
        Updates product stock level.
        """
        async with self._conn.cursor() as cur:
            await cur.execute(
                "UPDATE products SET stock = %s WHERE id = %s",
                (stock, product_id),
            )

    async def toggle_product_active(self, product_id: int) -> bool:
        """
        Toggles is_active status of a product and returns the new status.
        """
        async with self._conn.cursor() as cur:
            await cur.execute(
                "UPDATE products SET is_active = NOT is_active WHERE id = %s RETURNING is_active",
                (product_id,),
            )
            row = await cur.fetchone()
            return row[0]

