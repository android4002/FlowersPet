import logging
from psycopg_pool import AsyncConnectionPool
from app.core.config import settings

logger = logging.getLogger("flowerspet-db-pool")

# Initialize connection pool without opening immediately
pool = AsyncConnectionPool(
    conninfo=settings.DATABASE_URL,
    open=False,
    min_size=1,
    max_size=10,
    max_idle=30.0,
    name="flowerspet-pool"
)

async def get_db():
    """
    FastAPI dependency that yields an active database connection from the pool.
    """
    async with pool.connection() as conn:
        logger.info("Database connection acquired from pool.")
        yield conn
