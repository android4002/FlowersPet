import logging
import json
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from psycopg import AsyncConnection
from psycopg.rows import dict_row
from app.core.db import get_db
from app.schemas.product import Product

logger = logging.getLogger("flowerspet-api-products")
router = APIRouter()

# ── Static POST routes MUST be declared before /{product_id} to avoid conflicts ──

class ProductCreateRequest(BaseModel):
    name: str
    category: str
    price: float
    discount_price: Optional[float] = None
    stock: int
    is_active: bool = True
    image_url: str
    images: List[str] = []

@router.post("/", status_code=201)
async def create_product(payload: ProductCreateRequest, db: AsyncConnection = Depends(get_db)):
    """
    Creates a new product in the database within a committed transaction.
    """
    try:
        category_id = 1
        if payload.category == "Комнатные":
            category_id = 2
        elif payload.category == "Суккуленты":
            category_id = 3

        images_json = json.dumps(payload.images)
        details_json = json.dumps({})

        query = """
        INSERT INTO products (category_id, name, description, price, discount_price, image_url, stock, is_active, rating, reviews_count, images, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 4.8, 10, %s, %s)
        RETURNING id;
        """

        async with db.transaction():
            async with db.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        category_id,
                        payload.name,
                        f"Элегантный представитель категории {payload.category}",
                        payload.price,
                        payload.discount_price,
                        payload.image_url,
                        payload.stock,
                        payload.is_active,
                        images_json,
                        details_json
                    )
                )
                row = await cur.fetchone()
                new_id = row[0]

                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Синхронизация каталога", f"Создан новый товар: {payload.name} (ID: {new_id})")
                )

                return {
                    "status": "success",
                    "id": new_id,
                    "message": "Товар успешно создан в базе данных"
                }
    except Exception as e:
        logger.exception("Error creating product in PostgreSQL")
        raise HTTPException(status_code=500, detail="Ошибка при создании товара на сервере")


class UpdateSortOrderRequest(BaseModel):
    ids: List[int]

@router.post("/sort-order")
async def save_sort_order(payload: UpdateSortOrderRequest, db: AsyncConnection = Depends(get_db)):
    """
    Updates the sort_order of multiple products to persist drag-and-drop actions.
    """
    try:
        async with db.transaction():
            async with db.cursor() as cur:
                for index, prod_id in enumerate(payload.ids):
                    await cur.execute(
                        "UPDATE products SET sort_order = %s WHERE id = %s",
                        (index + 1, prod_id)
                    )

                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Сортировка товаров", f"Сохранен новый порядок для {len(payload.ids)} товаров")
                )

                return {
                    "status": "success",
                    "message": "Порядок сортировки товаров успешно сохранен в базе данных"
                }
    except Exception as e:
        logger.exception("Error saving product sort order in PostgreSQL")
        raise HTTPException(status_code=500, detail="Ошибка при сохранении порядка сортировки на сервере")


UPLOAD_DIR = "/Users/android/Desktop/FlowersPET/frontend/public/images/products"

@router.post("/upload")
async def upload_product_image(file: UploadFile = File(...)):
    """
    Uploads a product image and saves it to the frontend's public directory.
    Returns the relative URL to be saved in the database.
    """
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(
                status_code=400,
                detail="Неверный формат файла. Разрешены только изображения (jpg, png, webp, gif)."
            )

        unique_name = f"upload_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as f:
            while content := await file.read(1024 * 1024):
                f.write(content)

        relative_url = f"/images/products/{unique_name}"

        return {
            "status": "success",
            "url": relative_url,
            "filename": unique_name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error uploading file")
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


# ── Read routes ───────────────────────────────────────────────────────────────

@router.get("/")
async def list_products(
    page: int = Query(1, description="Page number"),
    limit: int = Query(10, description="Items per page"),
    category_id: Optional[int] = Query(None, description="Filter products by category ID"),
    db: AsyncConnection = Depends(get_db)
):
    """
    Retrieve list of products with pagination.
    """
    offset = (page - 1) * limit
    logger.info(f"DB Query: Fetching products with pagination. Filter category_id={category_id}, page={page}, limit={limit}")
    
    async with db.cursor(row_factory=dict_row) as cur:
        if category_id is not None:
            await cur.execute(
                """
                SELECT id, category_id, name, description, price, price AS base_price, discount_price, image_url, stock, is_active, rating, reviews_count, images, details, sort_order 
                FROM products 
                WHERE category_id = %s 
                ORDER BY sort_order ASC, id ASC
                LIMIT %s OFFSET %s
                """,
                (category_id, limit, offset)
            )
        else:
            await cur.execute(
                """
                SELECT id, category_id, name, description, price, price AS base_price, discount_price, image_url, stock, is_active, rating, reviews_count, images, details, sort_order 
                FROM products 
                ORDER BY sort_order ASC, id ASC
                LIMIT %s OFFSET %s
                """,
                (limit, offset)
            )
        rows = await cur.fetchall()
        for r in rows:
            r["price"] = float(r["price"]) if r["price"] is not None else 0.0
            r["base_price"] = float(r["base_price"]) if r["base_price"] is not None else 0.0
            r["discount_price"] = float(r["discount_price"]) if r["discount_price"] is not None else None
            r["rating"] = float(r["rating"]) if r["rating"] is not None else 4.8
        logger.info(f"DB Query Success: Fetched {len(rows)} products.")
        return rows

@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: int,
    db: AsyncConnection = Depends(get_db)
):
    """
    Retrieve details of a single product by its ID.
    """
    logger.info(f"DB Query: Fetching product details for ID: {product_id}")
    
    async with db.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            SELECT id, category_id, name, description, price, discount_price, image_url, stock, is_active, rating, reviews_count, images, details 
            FROM products 
            WHERE id = %s
            """,
            (product_id,)
        )
        row = await cur.fetchone()
        
        if not row:
            logger.warning(f"DB Query Failed: Product with ID {product_id} not found.")
            raise HTTPException(status_code=404, detail="Product not found")
            
        logger.info(f"DB Query Success: Product details found for ID: {product_id}")
        return row

from pydantic import BaseModel

class UpdatePriceRequest(BaseModel):
    price: float

class UpdateStockRequest(BaseModel):
    stock: int

@router.post("/{product_id}/price")
async def update_product_price(product_id: int, payload: UpdatePriceRequest, db: AsyncConnection = Depends(get_db)):
    try:
        async with db.transaction():
            async with db.cursor() as cur:
                await cur.execute("UPDATE products SET price = %s WHERE id = %s", (payload.price, product_id))
                # Log to agent_logs
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Изменение цен", f"Product ID: {product_id}, Новая цена: {payload.price} руб.")
                )
                return {"status": "success", "message": "Price updated"}
    except Exception as e:
        logger.exception(f"Error updating price for product {product_id}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{product_id}/stock")
async def update_product_stock(product_id: int, payload: UpdateStockRequest, db: AsyncConnection = Depends(get_db)):
    try:
        async with db.transaction():
            async with db.cursor() as cur:
                await cur.execute("UPDATE products SET stock = %s WHERE id = %s", (payload.stock, product_id))
                # Log to agent_logs
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Редактирование остатков", f"Product ID: {product_id}, Новый остаток: {payload.stock} шт.")
                )
                return {"status": "success", "message": "Stock updated"}
    except Exception as e:
        logger.exception(f"Error updating stock for product {product_id}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    base_price: Optional[float] = None
    discount_price: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None

@router.put("/{product_id}")
async def update_product(product_id: int, payload: UpdateProductRequest, db: AsyncConnection = Depends(get_db)):
    try:
        price_val = payload.price if payload.price is not None else payload.base_price
        updates = []
        params = []
        
        if payload.name is not None:
            updates.append("name = %s")
            params.append(payload.name)
        if payload.description is not None:
            updates.append("description = %s")
            params.append(payload.description)
        if payload.category is not None:
            category_id = 1
            if payload.category == "Комнатные":
                category_id = 2
            elif payload.category == "Суккуленты":
                category_id = 3
            updates.append("category_id = %s")
            params.append(category_id)
        if price_val is not None:
            updates.append("price = %s")
            params.append(price_val)
        if payload.discount_price is not None:
            updates.append("discount_price = %s")
            params.append(None if payload.discount_price <= 0 else payload.discount_price)
        elif "discount_price" in payload.model_fields_set:
            updates.append("discount_price = %s")
            params.append(None)
        if payload.stock is not None:
            updates.append("stock = %s")
            params.append(payload.stock)
        if payload.is_active is not None:
            updates.append("is_active = %s")
            params.append(payload.is_active)
        if payload.image_url is not None:
            updates.append("image_url = %s")
            params.append(payload.image_url)
        if payload.images is not None:
            import json
            updates.append("images = %s")
            params.append(json.dumps(payload.images))
            
        if not updates:
            return {"status": "success", "message": "No updates applied"}
            
        params.append(product_id)
        query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
        
        async with db.transaction():
            async with db.cursor() as cur:
                await cur.execute(query, tuple(params))
                details = f"Product ID: {product_id}, Updates: {payload.model_fields_set}"
                await cur.execute(
                    "INSERT INTO admin_action_logs (user_id, action, details) VALUES (%s, %s, %s)",
                    (1, "Синхронизация каталога", details)
                )
                return {"status": "success", "message": "Product updated successfully"}
    except Exception as e:
        logger.exception(f"Error updating product {product_id}")
        raise HTTPException(status_code=500, detail=str(e))



