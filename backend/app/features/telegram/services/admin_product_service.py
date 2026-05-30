import math
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String, Boolean, Numeric, Text, select, func

from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

async_engine = create_async_engine(db_url, echo=False)
async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class DBProduct(Base):
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int | None] = mapped_column(nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    discount_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class AdminProductService:
    """
    SQLAlchemy 2.0 Service for administering products in the database.
    """
    
    async def get_products_page(self, page: int, limit: int = 5) -> tuple[list[DBProduct], int]:
        """
        Returns a paginated list of DBProduct objects and the total pages count.
        """
        offset = (page - 1) * limit
        async with async_session() as session:
            # Query products
            stmt = select(DBProduct).order_by(DBProduct.id).offset(offset).limit(limit)
            result = await session.execute(stmt)
            products = list(result.scalars().all())
            
            # Count total pages
            count_stmt = select(func.count()).select_from(DBProduct)
            count_result = await session.execute(count_stmt)
            total_count = count_result.scalar() or 0
            
            total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
            return products, total_pages

    async def get_product_by_id(self, product_id: int) -> DBProduct | None:
        """
        Returns a single product object by its ID.
        """
        async with async_session() as session:
            stmt = select(DBProduct).where(DBProduct.id == product_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def update_product_price(self, product_id: int, price: float) -> None:
        """
        Updates the product price.
        """
        async with async_session() as session:
            async with session.begin():
                stmt = select(DBProduct).where(DBProduct.id == product_id)
                result = await session.execute(stmt)
                p = result.scalar_one_or_none()
                if p:
                    p.price = price

    async def update_product_discount_price(self, product_id: int, discount_price: float | None) -> None:
        """
        Updates the product discount price.
        """
        async with async_session() as session:
            async with session.begin():
                stmt = select(DBProduct).where(DBProduct.id == product_id)
                result = await session.execute(stmt)
                p = result.scalar_one_or_none()
                if p:
                    p.discount_price = discount_price

    async def update_product_stock(self, product_id: int, stock: int) -> None:
        """
        Updates the product stock level.
        """
        async with async_session() as session:
            async with session.begin():
                stmt = select(DBProduct).where(DBProduct.id == product_id)
                result = await session.execute(stmt)
                p = result.scalar_one_or_none()
                if p:
                    p.stock = stock

    async def toggle_product_active(self, product_id: int) -> bool:
        """
        Toggles the is_active status of a product and returns the new status.
        """
        async with async_session() as session:
            async with session.begin():
                stmt = select(DBProduct).where(DBProduct.id == product_id)
                result = await session.execute(stmt)
                p = result.scalar_one_or_none()
                if p:
                    p.is_active = not p.is_active
                    return p.is_active
                return False
