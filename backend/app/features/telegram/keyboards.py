from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import ReplyKeyboardBuilder
from aiogram.filters.callback_data import CallbackData

class ProductCallbackFactory(CallbackData, prefix="prod"):
    id: int
    action: str

def get_main_menu_keyboard(role: str) -> ReplyKeyboardMarkup:
    """
    Returns the persistent Reply Keyboard for the main menu,
    customized according to the user's role.
    """
    builder = ReplyKeyboardBuilder()
    builder.row(
        KeyboardButton(text="📦 Статус заказов"),
        KeyboardButton(text="📊 Дневной отчёт")
    )
    if role == "admin":
        builder.row(KeyboardButton(text="👑 Панель администратора"))
    
    return builder.as_markup(
        resize_keyboard=True,
        placeholder="Выберите нужное действие..."
    )

def get_admin_start_keyboard() -> InlineKeyboardMarkup:
    """
    Returns the entry inline keyboard for the Admin Panel.
    """
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📦 Управление товарами", 
                    callback_data=ProductCallbackFactory(id=1, action="page").pack()
                )
            ]
        ]
    )

def get_products_page_keyboard(products: list, page: int, total_pages: int) -> InlineKeyboardMarkup:
    """
    Returns an inline keyboard with a paginated product list and navigation controls.
    """
    buttons = []
    
    # Add product items
    for p in products:
        status_emoji = "🟢" if p.is_active else "🔴"
        buttons.append([
            InlineKeyboardButton(
                text=f"[{status_emoji}] {p.name} ({p.price:.0f} ₽)",
                callback_data=ProductCallbackFactory(id=p.id, action="detail").pack()
            )
        ])
        
    # Divider before navigation row
    buttons.append([
        InlineKeyboardButton(
            text="────────────────────",
            callback_data=ProductCallbackFactory(id=0, action="none").pack()
        )
    ])
        
    # Navigation row
    nav_row = []
    
    # Back button
    if page > 1:
        nav_row.append(
            InlineKeyboardButton(
                text="⬅️ Назад", 
                callback_data=ProductCallbackFactory(id=page - 1, action="page").pack()
            )
        )
    else:
        nav_row.append(
            InlineKeyboardButton(
                text="🔘", 
                callback_data=ProductCallbackFactory(id=0, action="none").pack()
            )
        )
        
    # Page indicator
    nav_row.append(
        InlineKeyboardButton(
            text=f"Стр. {page}/{total_pages}", 
            callback_data=ProductCallbackFactory(id=page, action="none").pack()
        )
    )
    
    # Forward button
    if page < total_pages:
        nav_row.append(
            InlineKeyboardButton(
                text="Вперед ➡️", 
                callback_data=ProductCallbackFactory(id=page + 1, action="page").pack()
            )
        )
    else:
        nav_row.append(
            InlineKeyboardButton(
                text="🔘", 
                callback_data=ProductCallbackFactory(id=0, action="none").pack()
            )
        )
        
    buttons.append(nav_row)
    
    # Close button
    buttons.append([
        InlineKeyboardButton(
            text="« Закрыть", 
            callback_data=ProductCallbackFactory(id=0, action="close").pack()
        )
    ])
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)
