# FlowersPET — Full Sync Status

Updated: 2026-05-29

## Synchronized ✅

| Feature | Channel | Endpoint |
|---------|---------|----------|
| Product CRUD | Web admin, API | `PUT/DELETE /api/v1/products/{id}` |
| Product sort | Web admin | `POST /api/v1/products/sort-order` |
| Image upload | Web admin | `POST /api/v1/products/upload` |
| Order create | Site frontend | `POST /api/v1/orders/` |
| Custom order | Site frontend | `POST /api/v1/orders/custom` |
| Order status | Web admin | `POST /api/v1/admin/orders/{id}/status` |
| Order PDF | Web admin | `GET /api/v1/admin/orders/{id}/receipt` |
| Staff toggle | Web admin | `POST /api/v1/admin/staff/{chat_id}/toggle` |
| Staff message | Web admin | `POST /api/v1/admin/staff/{chat_id}/message` |
| Broadcast | Web admin | `POST /api/v1/admin/staff/broadcast` |
| TG alerts | Auto | `TelegramNotificationService` |
| Bot auth | Telegram | `ManagerAuthMiddleware` → DB |
| Bot /status | Telegram | active orders count |
| Bot /report_daily | Telegram | revenue + top products |

## Not implemented (backlog)

- `GET /api/v1/admin/orders/{id}/status` — get single order status
- `POST /api/v1/admin/orders/{id}/cancel` — cancel endpoint
- Telegram `/list_orders` — order list in bot (handler file exists, not connected)
- Telegram inline status change — change order status from bot
- Dynamic product ratings — currently hardcoded 4.8

## Fixed bugs (2026-05-29)

1. `main.py` — engine scope error + wrong `await engine.begin()` call
2. `admin_staff.py` — role/is_active columns swapped in row mapping
3. `staff/actions.ts` — PATCH → POST /toggle (endpoint mismatch)
4. `products.py` — route conflict: /sort-order and /upload matched as /{product_id}
