import logging
import json
from psycopg import AsyncConnection
from psycopg.rows import dict_row

logger = logging.getLogger("flowerspet-order-repo")

class OrderRepository:
    """
    Repository exposing database queries on the `orders` table
    for the Telegram bot and administrative panel.
    """

    def __init__(self, conn: AsyncConnection) -> None:
        self._conn = conn

    async def count_active_today(self) -> int:
        """
        Returns the number of non-cancelled orders created today (Moscow time).
        """
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                SELECT COUNT(*)
                FROM orders
                WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') = CURRENT_DATE
                  AND status != 'cancelled'
                """
            )
            row = await cur.fetchone()
            count = int(row[0]) if row else 0
            logger.debug("OrderRepository: active_today count=%s", count)
            return count

    async def get_daily_report(self) -> dict:
        """
        Aggregates today's orders into a summary report.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT
                    COALESCE(SUM(total_amount), 0)::float                         AS revenue,
                    COUNT(*) FILTER (
                        WHERE NOT (items::jsonb @> '[{"product_id": 0}]')
                    )                                                              AS standard_count,
                    COUNT(*) FILTER (
                        WHERE items::jsonb @> '[{"product_id": 0}]'
                    )                                                              AS custom_count
                FROM orders
                WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') = CURRENT_DATE
                  AND status != 'cancelled'
                """
            )
            summary = await cur.fetchone()

            await cur.execute(
                """
                SELECT
                    item->>'name'              AS product_name,
                    SUM((item->>'quantity')::int)::int      AS total_qty,
                    SUM((item->>'line_total')::float)       AS total_revenue
                FROM orders,
                     jsonb_array_elements(items::jsonb) AS item
                WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') = CURRENT_DATE
                  AND status != 'cancelled'
                  AND (item->>'product_id')::int != 0
                GROUP BY product_name
                ORDER BY total_qty DESC
                LIMIT 5
                """
            )
            top_products = await cur.fetchall()

        report = {
            "revenue": summary["revenue"],
            "standard_count": int(summary["standard_count"]),
            "custom_count": int(summary["custom_count"]),
            "top_products": list(top_products),
        }
        logger.debug("OrderRepository: daily_report=%s", report)
        return report

    async def get_all_orders(self) -> list[dict]:
        """
        Returns a list of all orders, ordered by creation date descending.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute("SELECT id, customer_name, phone, email, address, total_amount, items, status, created_at FROM orders ORDER BY created_at DESC")
            return await cur.fetchall()

    async def get_order_by_id(self, order_id: int) -> dict | None:
        """
        Retrieves a single order by its ID.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute("SELECT id, customer_name, phone, email, address, total_amount, items, status, created_at FROM orders WHERE id = %s", (order_id,))
            return await cur.fetchone()

    async def update_order_status(self, order_id: int, status: str) -> dict | None:
        """
        Updates an order status in PostgreSQL and logs the action.
        """
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "UPDATE orders SET status = %s WHERE id = %s RETURNING id, customer_name, status",
                (status, order_id)
            )
            order = await cur.fetchone()
            if order:
                # Log action to agent_logs
                details = f"Заказ #{order_id} переведен в статус: {status}"
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Смена статуса заказа", details)
                )
                logger.info("OrderRepository: updated status for order_id=%s. New status: %s", order_id, status)
            return order
