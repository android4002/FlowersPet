import logging
from fastapi import APIRouter, HTTPException, Depends
from psycopg import AsyncConnection
from psycopg.rows import dict_row
from app.core.db import get_db

logger = logging.getLogger("flowerspet-analytics-api")
router = APIRouter()

@router.get("/daily-stats")
async def get_daily_stats(db: AsyncConnection = Depends(get_db)):
    """
    Retrieves real business statistics for the admin dashboard.
    """
    try:
        async with db.cursor(row_factory=dict_row) as cur:
            # 1. Total revenue for successful orders today (Moscow time)
            await cur.execute(
                """
                SELECT COALESCE(SUM(total_amount), 0)::float AS revenue
                FROM orders
                WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') = CURRENT_DATE
                  AND status != 'cancelled'
                """
            )
            rev_row = await cur.fetchone()
            revenue = rev_row["revenue"] if rev_row else 0.0

            # 2. Number of active orders (pending, processing, delivering)
            await cur.execute(
                """
                SELECT COUNT(*)::int AS active_count
                FROM orders
                WHERE status IN ('pending', 'processing', 'delivering')
                """
            )
            act_row = await cur.fetchone()
            active_count = act_row["active_count"] if act_row else 0

            # 3. Total unique customers (new clients)
            await cur.execute("SELECT COUNT(DISTINCT phone)::int AS customer_count FROM orders")
            cust_row = await cur.fetchone()
            customer_count = cust_row["customer_count"] if cust_row else 0

            # 4. Total orders count
            await cur.execute("SELECT COUNT(*)::int AS total_count FROM orders")
            tot_row = await cur.fetchone()
            total_count = tot_row["total_count"] if tot_row else 0

            return {
                "revenue": revenue,
                "active_orders": active_count,
                "new_clients": customer_count,
                "total_orders": total_count
            }
    except Exception as e:
        logger.exception("Error calculating daily stats")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class SiteSettingsUpdateSchema(BaseModel):
    # Hero
    hero_title: str
    hero_subtitle: str
    hero_btn_primary: str
    hero_btn_secondary: str
    # Trust badges
    trust_1_title: str
    trust_1_text: str
    trust_2_title: str
    trust_2_text: str
    trust_3_title: str
    trust_3_text: str
    # Catalog
    catalog_title: str
    catalog_subtitle: str
    # About
    about_title: str
    about_text: str
    about_years: str
    about_years_text: str
    # Footer
    footer_description: str
    footer_phone: str
    footer_instagram: str
    footer_address: str

SETTINGS_DEFAULTS = {
    "hero_title": "Цветы, созданные дарить счастье",
    "hero_subtitle": "Авторские букеты и редкие комнатные растения премиум-класса с заботливой доставкой за 60 минут.",
    "hero_btn_primary": "Перейти к цветам",
    "hero_btn_secondary": "Индивидуальный заказ",
    "trust_1_title": "Доставка за 60 минут",
    "trust_1_text": "Собственные вежливые курьеры",
    "trust_2_title": "Свежесть 100%",
    "trust_2_text": "Прямые поставки трижды в неделю",
    "trust_3_title": "Контроль качества",
    "trust_3_text": "Фото букета перед отправкой",
    "catalog_title": "Наш ассортимент",
    "catalog_subtitle": "Премиальные букеты, роскошные декоративно-лиственные монстеры и фикусы, а также саженцы для вашего сада.",
    "about_title": "Цветочная мастерская «Планета цветов»",
    "about_text": "Мы — команда профессиональных флористов из города Иваново, влюбленных в свое дело. Уже более 8 лет мы создаем авторские букеты премиум-класса и озеленяем интерьеры редкими комнатными растениями.\n\nНаш главный приоритет — безупречная свежесть каждого цветка и индивидуальный подход к каждому клиенту.",
    "about_years": "8+ лет опыта",
    "about_years_text": "Собрано более 50 000 индивидуальных букетов и подарено миллионы улыбок.",
    "footer_description": "Цветочный гипермаркет в Иванове. Делаем счастливее ваших близких каждый день с 2018 года.",
    "footer_phone": "+7 (4932) 99-99-99",
    "footer_instagram": "@planeta_cvetov_ivanovo",
    "footer_address": "г. Иваново, пер. Пограничный, 80",
}

@router.get("/settings")
async def get_site_settings(db: AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor(row_factory=dict_row) as cur:
            await cur.execute("SELECT key, value FROM site_settings")
            rows = await cur.fetchall()
            settings_dict = {row["key"]: row["value"] for row in rows}
            for key, val in SETTINGS_DEFAULTS.items():
                if key not in settings_dict:
                    settings_dict[key] = val
            return settings_dict
    except Exception as e:
        logger.exception("Error fetching site settings")
        raise HTTPException(status_code=500, detail="Ошибка при получении настроек сайта")

@router.post("/settings")
async def update_site_settings(payload: SiteSettingsUpdateSchema, db: AsyncConnection = Depends(get_db)):
    try:
        async with db.transaction():
            async with db.cursor() as cur:
                for key, val in payload.model_dump().items():
                    await cur.execute(
                        """
                        INSERT INTO site_settings (key, value)
                        VALUES (%s, %s)
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                        """,
                        (key, val)
                    )
                return {"status": "success", "message": "Настройки сайта успешно обновлены"}
    except Exception as e:
        logger.exception("Error updating site settings")
        raise HTTPException(status_code=500, detail="Ошибка при обновлении настроек сайта")
