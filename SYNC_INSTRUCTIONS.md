# Синхронизация FlowersPET — актуальный статус

Обновлено: 2026-05-29

## Архитектура

```
Frontend (Next.js :3000) ──fetch──► Backend (FastAPI :8000) ──► PostgreSQL
Telegram Bot (aiogram v3) ──────────────────────────────────► PostgreSQL
```

## Статус компонентов

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Backend API | ✅ Работает | порт 8000 |
| Frontend сайт | ✅ Работает | порт 3000 |
| Админка (Next.js) | ✅ Работает | `/admin` |
| Telegram Bot | ✅ Работает | long-polling |
| SQLAdmin панель | ✅ Работает | `/admin` на бэке |

## Что синхронизировано

- Товары: CRUD, сортировка, загрузка фото, цены, остатки
- Заказы: создание (обычный + кастомный), смена статуса, PDF-чек
- Персонал: список, блоClaudeвка/разблоClaudeвка, рассылка
- Уведомления: Telegram-алерты флористам и клиентам при смене статуса

## Что НЕ реализовано (backlog)

### 1. Telegram: список заказов `/list_orders`
Файл-заготовка есть: `backend/app/features/telegram/handlers/list_orders.py`
Нужно: подключить роутер в `manager_bot.py` и реализовать хендлеры.

### 2. Telegram: смена статуса заказа из бота
Нужно: inline-клавиатура с выбором статуса → `POST /api/v1/admin/orders/{id}/status`

### 3. Endpoint отмены заказа
```python
POST /api/v1/admin/orders/{order_id}/cancel
# sets status='cancelled', sends notifications
```

### 4. Динамический рейтинг товаров
Сейчас: статические значения (4.8, 10 отзывов) из seed.
Нужно: таблица отзывов + агрегация.

## Известные ограничения

- CORS: только `localhost:3000` — при деплое добавить домен в `app/main.py:124`
- `UPLOAD_DIR` захардкожен в `products.py` — вынести в `config.py`
- `admin_action_logs` пишется с `user_id=1` — нет реальной авторизации
- Статус-обновление из бота идёт напрямую в DB, минуя API — нарушает единый источник правды

## Запуск

```bash
# Backend
cd backend && .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Frontend
cd frontend && npm run dev
```

## Тестирование эндпоинтов

```bash
curl http://127.0.0.1:8000/api/v1/products/?limit=3
curl http://127.0.0.1:8000/api/v1/admin/orders/
curl http://127.0.0.1:8000/api/v1/admin/staff/
```
