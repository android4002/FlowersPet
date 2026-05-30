import logging
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext

from app.features.telegram.services.admin_product_service import AdminProductService
from app.features.telegram.states import ProductAdmin
from app.features.telegram.keyboards import (
    get_admin_start_keyboard,
    get_products_page_keyboard,
    ProductCallbackFactory
)

logger = logging.getLogger("flowerspet-manager-admin-panel")
admin_router = Router(name="admin_panel")
service = AdminProductService()

@admin_router.message(Command("admin"))
@admin_router.message(F.text == "👑 Панель администратора")
async def cmd_admin(message: Message, manager: dict) -> None:
    """
    Entrypoint for the admin control panel.
    Strictly verifies that the manager has the 'admin' role.
    """
    if manager.get("role") != "admin":
        await message.answer("🚫 Недостаточно прав для выполнения операции")
        logger.warning(
            "Access denied to admin panel for chat_id=%s role=%s",
            message.from_user.id,
            manager.get("role")
        )
        return

    divider = "────────────────────"
    text = (
        "👑 <b>Панель управления → Главное меню</b>\n"
        f"{divider}\n"
        "📱 <b>Telegram-помощник (Быстрый склад):</b>\n"
        "• Оперативное изменение цен и скидок\n"
        "• Изменение остатков на складе на ходу\n"
        "• Мгновенное скрытие / показ товаров\n\n"
        "🖥 <b>Web-панель управления (SQLAdmin):</b>\n"
        "• ➕ Добавление / удаление товаров\n"
        "• 🖼 Загрузка картинок, галерей и категорий\n"
        "• 👥 Управление персоналом и правами доступа\n"
        "• 🛒 Полный CRUD заказов и пользователей\n"
        f"{divider}\n"
        "📍 Web-адрес: <code>http://127.0.0.1:8000/admin</code>\n"
        f"{divider}\n"
        "Выберите раздел для быстрого управления:"
    )
    await message.answer(text, reply_markup=get_admin_start_keyboard())
    logger.info("cmd_admin: admin panel opened by chat_id=%s", message.from_user.id)


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "page"))
async def process_manage_products(callback: CallbackQuery, callback_data: ProductCallbackFactory) -> None:
    """
    Shows a paginated list of products.
    """
    page = callback_data.id
    try:
        products, total_pages = await service.get_products_page(page=page, limit=5)
        keyboard = get_products_page_keyboard(products, page, total_pages)
        
        text = (
            "👑 <b>Панель управления → 📦 Управление товарами</b>\n"
            "────────────────────\n"
            "Выберите товар для просмотра детальной информации и редактирования:"
        )
        await callback.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error loading product page %s", page)
        await callback.answer("❌ Ошибка при загрузке списка товаров", show_alert=True)
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "detail"))
async def process_product_detail(
    callback: CallbackQuery, 
    callback_data: ProductCallbackFactory,
    flash_msg: str = None
) -> None:
    """
    Shows detailed product card with administration controls.
    """
    product_id = callback_data.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return

        status_visible = "🌍 Отображается" if p.is_active else "🔒 Скрыт"
        status_stock = f"🟢 На складе ({p.stock} шт.)" if p.stock > 0 else "🔴 Нет в наличии (0 шт.)"
        
        if p.discount_price is not None and p.price > 0:
            pct = ((p.price - p.discount_price) / p.price) * 100
            disc_price_str = f"🔥 Активна (-{pct:.0f}% / {p.discount_price:.0f} ₽)"
        else:
            disc_price_str = "❌ Выключена"
        
        divider = "────────────────────"
        flash_block = f"\n\n⏱ <i>секунду назад</i> {flash_msg}" if flash_msg else ""
        
        text = (
            "👑 <b>Панель управления → 📦 Управление товарами → 📝 Карточка товара</b>\n"
            f"{divider}\n"
            f"<b>🛒 Товар:</b> {p.name}\n"
            f"{divider}\n"
            f"🆔 ID товара: <code>#{p.id}</code>\n"
            f"📦 Наличие: {status_stock}\n"
            f"💰 Базовая стоимость: <code>{p.price:.0f} ₽</code>\n"
            f"🏷 Скидка: {disc_price_str}\n"
            f"⚡️ Видимость на сайте: {status_visible}{flash_block}\n"
        )

        status_toggle_text = "🔄 Скрыть (🔒)" if p.is_active else "🔄 Показать (🌍)"
        buttons = [
            [
                InlineKeyboardButton(
                    text="💰 Изменить цену", 
                    callback_data=ProductCallbackFactory(id=product_id, action="edit_price").pack()
                ),
                InlineKeyboardButton(
                    text="🏷 Изменить скидку", 
                    callback_data=ProductCallbackFactory(id=product_id, action="edit_discount").pack()
                )
            ],
            [
                InlineKeyboardButton(
                    text="📦 Изменить остаток", 
                    callback_data=ProductCallbackFactory(id=product_id, action="edit_stock").pack()
                ),
                InlineKeyboardButton(
                    text=status_toggle_text, 
                    callback_data=ProductCallbackFactory(id=product_id, action="toggle_active").pack()
                )
            ],
            [
                InlineKeyboardButton(
                    text="↩️ Вернуться в каталог", 
                    callback_data=ProductCallbackFactory(id=1, action="page").pack()
                )
            ]
        ]
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        await callback.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error showing product detail for %s", product_id)
        await callback.answer("❌ Ошибка при загрузке карточки товара", show_alert=True)
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "toggle_active"))
async def process_toggle_active(callback: CallbackQuery, callback_data: ProductCallbackFactory) -> None:
    """
    Toggles a product's active status.
    """
    product_id = callback_data.id
    admin_id = callback.from_user.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return

        old_status = p.is_active
        new_status = await service.toggle_product_active(product_id)
        
        logger.info(
            "AdminAction: Admin chat_id=%s toggled is_active for product_id=%s. Old: %s, New: %s",
            admin_id, product_id, old_status, new_status
        )
        await callback.answer("Статус товара успешно изменен")
        
        # Immediately edit product detail block with flash message
        await process_product_detail(callback, callback_data, flash_msg="✅ Статус изменен")
    except Exception as e:
        logger.exception("Error toggling active status for product_id=%s", product_id)
        await callback.answer("❌ Ошибка конкурентного доступа при обновлении статуса", show_alert=True)


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "close"))
async def process_close(callback: CallbackQuery) -> None:
    """
    Deletes the menu message to clean up chat.
    """
    await callback.message.delete()
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "none"))
async def process_none(callback: CallbackQuery) -> None:
    """
    Handles clicks on static indicators.
    """
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "edit_price"))
async def process_edit_price(callback: CallbackQuery, callback_data: ProductCallbackFactory, state: FSMContext) -> None:
    """
    Asks the admin to enter a new price.
    """
    product_id = callback_data.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return
            
        await state.update_data(product_id=product_id)
        await state.set_state(ProductAdmin.waiting_for_price)
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(
                    text="« Отмена", 
                    callback_data=ProductCallbackFactory(id=product_id, action="detail").pack()
                )
            ]]
        )
        
        text = (
            f"👑 <b>Панель управления → 📦 Управление товарами → 💰 Изменение цены</b>\n"
            "────────────────────\n"
            f"🛒 Товар: <b>{p.name}</b>\n"
            f"Текущая цена: <code>{p.price:.0f} ₽</code>\n\n"
            f"Введите новую базовую цену для товара {p.name} (положительное число):"
        )
        await callback.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error initiating edit price for product_id=%s", product_id)
        await callback.answer("❌ Ошибка при подготовке редактирования", show_alert=True)
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "edit_discount"))
async def process_edit_discount(callback: CallbackQuery, callback_data: ProductCallbackFactory, state: FSMContext) -> None:
    """
    Asks the admin to enter a new discount price or remove it.
    """
    product_id = callback_data.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return
            
        await state.update_data(product_id=product_id)
        await state.set_state(ProductAdmin.waiting_for_discount)
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Убрать скидку (Сбросить)", 
                        callback_data=ProductCallbackFactory(id=product_id, action="remove_discount").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="« Отмена", 
                        callback_data=ProductCallbackFactory(id=product_id, action="detail").pack()
                    )
                ]
            ]
        )
        
        current_discount = f"{p.discount_price:.0f} ₽" if p.discount_price is not None else "Выключена"
        text = (
            f"👑 <b>Панель управления → 📦 Управление товарами → 🏷 Изменение скидки</b>\n"
            "────────────────────\n"
            f"🛒 Товар: <b>{p.name}</b>\n"
            f"Текущая скидка: <code>{current_discount}</code>\n"
            f"Базовая цена: <code>{p.price:.0f} ₽</code>\n\n"
            f"Введите новую цену со скидкой для товара {p.name} (должна быть строго меньше {p.price:.0f} ₽):"
        )
        await callback.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error initiating edit discount for product_id=%s", product_id)
        await callback.answer("❌ Ошибка при подготовке редактирования", show_alert=True)
    await callback.answer()


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "remove_discount"))
async def process_remove_discount(callback: CallbackQuery, callback_data: ProductCallbackFactory, state: FSMContext) -> None:
    """
    Removes product discount price.
    """
    product_id = callback_data.id
    admin_id = callback.from_user.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return
            
        old_discount = p.discount_price
        await service.update_product_discount_price(product_id, None)
        
        logger.info(
            "AdminAction: Admin chat_id=%s removed discount for product_id=%s. Old: %s, New: None",
            admin_id, product_id, old_discount
        )
        await callback.answer("Скидка успешно удалена")
        await state.clear()
        
        await process_product_detail(callback, callback_data, flash_msg="✅ Скидка сброшена")
    except Exception as e:
        logger.exception("Error removing discount for product_id=%s", product_id)
        await callback.answer("❌ Ошибка конкурентного доступа при удалении скидки", show_alert=True)


@admin_router.callback_query(ProductCallbackFactory.filter(F.action == "edit_stock"))
async def process_edit_stock(callback: CallbackQuery, callback_data: ProductCallbackFactory, state: FSMContext) -> None:
    """
    Asks the admin to enter a new stock value.
    """
    product_id = callback_data.id
    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await callback.answer("Товар не найден", show_alert=True)
            return
            
        await state.update_data(product_id=product_id)
        await state.set_state(ProductAdmin.waiting_for_stock)
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(
                    text="« Отмена", 
                    callback_data=ProductCallbackFactory(id=product_id, action="detail").pack()
                )
            ]]
        )
        
        text = (
            f"👑 <b>Панель управления → 📦 Управление товарами → 📦 Изменение остатка</b>\n"
            "────────────────────\n"
            f"🛒 Товар: <b>{p.name}</b>\n"
            f"Текущий остаток: <code>{p.stock} шт.</code>\n\n"
            f"Введите новый остаток на складе для товара {p.name} (целое неотрицательное число):"
        )
        await callback.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error initiating edit stock for product_id=%s", product_id)
        await callback.answer("❌ Ошибка при подготовке редактирования", show_alert=True)
    await callback.answer()


@admin_router.message(ProductAdmin.waiting_for_price)
async def process_price_input(message: Message, state: FSMContext) -> None:
    """
    Processes FSM input for new price.
    """
    try:
        price = float(message.text.strip())
        if price <= 0:
            raise ValueError
    except ValueError:
        await message.answer("❌ Ошибка: Введите корректное положительное число")
        return

    data = await state.get_data()
    product_id = data["product_id"]
    admin_id = message.from_user.id

    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await message.answer("❌ Ошибка: Товар не найден.")
            await state.clear()
            return

        old_price = p.price
        await service.update_product_price(product_id, price)
        
        logger.info(
            "AdminAction: Admin chat_id=%s updated price for product_id=%s. Old: %s, New: %s",
            admin_id, product_id, old_price, price
        )
        await state.clear()
        
        # Show updated detail view as a new message
        p = await service.get_product_by_id(product_id)
        if p:
            status_visible = "🌍 Отображается" if p.is_active else "🔒 Скрыт"
            status_stock = f"🟢 На складе ({p.stock} шт.)" if p.stock > 0 else "🔴 Нет в наличии (0 шт.)"
            
            if p.discount_price is not None and p.price > 0:
                pct = ((p.price - p.discount_price) / p.price) * 100
                disc_price_str = f"🔥 Активна (-{pct:.0f}% / {p.discount_price:.0f} ₽)"
            else:
                disc_price_str = "❌ Выключена"
                
            divider = "────────────────────"
            text = (
                "👑 <b>Панель управления → 📦 Управление товарами → 📝 Карточка товара</b>\n"
                f"{divider}\n"
                f"<b>🛒 Товар:</b> {p.name}\n"
                f"{divider}\n"
                f"🆔 ID товара: <code>#{p.id}</code>\n"
                f"📦 Наличие: {status_stock}\n"
                f"💰 Базовая стоимость: <code>{p.price:.0f} ₽</code>\n"
                f"🏷 Скидка: {disc_price_str}\n"
                f"⚡️ Видимость на сайте: {status_visible}\n\n"
                "⏱ <i>секунду назад</i> ✅ Изменено"
            )
            
            status_toggle_text = "🔄 Скрыть (🔒)" if p.is_active else "🔄 Показать (🌍)"
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💰 Изменить цену", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_price").pack()
                    ),
                    InlineKeyboardButton(
                        text="🏷 Изменить скидку", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_discount").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📦 Изменить остаток", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_stock").pack()
                    ),
                    InlineKeyboardButton(
                        text=status_toggle_text, 
                        callback_data=ProductCallbackFactory(id=product_id, action="toggle_active").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="↩️ Вернуться в каталог", 
                        callback_data=ProductCallbackFactory(id=1, action="page").pack()
                    )
                ]
            ]
            keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
            await message.answer(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error saving price for product_id=%s", product_id)
        await message.answer("❌ Произошла ошибка конкурентного доступа при сохранении цены.")


@admin_router.message(ProductAdmin.waiting_for_discount)
async def process_discount_input(message: Message, state: FSMContext) -> None:
    """
    Processes FSM input for new discount price.
    """
    data = await state.get_data()
    product_id = data["product_id"]
    admin_id = message.from_user.id

    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await message.answer("❌ Ошибка: Товар не найден.")
            await state.clear()
            return
            
        try:
            discount = float(message.text.strip())
            if discount <= 0:
                raise ValueError
        except ValueError:
            await message.answer("❌ Ошибка: Введите корректное положительное число")
            return

        if discount >= p.price:
            await message.answer(f"❌ Ошибка: Цена со скидкой должна быть строго меньше базовой цены ({p.price:.0f} ₽)")
            return

        old_discount = p.discount_price
        await service.update_product_discount_price(product_id, discount)
        
        logger.info(
            "AdminAction: Admin chat_id=%s updated discount for product_id=%s. Old: %s, New: %s",
            admin_id, product_id, old_discount, discount
        )
        await state.clear()
        
        # Show updated detail view as a new message
        p = await service.get_product_by_id(product_id)
        if p:
            status_visible = "🌍 Отображается" if p.is_active else "🔒 Скрыт"
            status_stock = f"🟢 На складе ({p.stock} шт.)" if p.stock > 0 else "🔴 Нет в наличии (0 шт.)"
            
            if p.discount_price is not None and p.price > 0:
                pct = ((p.price - p.discount_price) / p.price) * 100
                disc_price_str = f"🔥 Активна (-{pct:.0f}% / {p.discount_price:.0f} ₽)"
            else:
                disc_price_str = "❌ Выключена"
                
            divider = "────────────────────"
            text = (
                "👑 <b>Панель управления → 📦 Управление товарами → 📝 Карточка товара</b>\n"
                f"{divider}\n"
                f"<b>🛒 Товар:</b> {p.name}\n"
                f"{divider}\n"
                f"🆔 ID товара: <code>#{p.id}</code>\n"
                f"📦 Наличие: {status_stock}\n"
                f"💰 Базовая стоимость: <code>{p.price:.0f} ₽</code>\n"
                f"🏷 Скидка: {disc_price_str}\n"
                f"⚡️ Видимость на сайте: {status_visible}\n\n"
                "⏱ <i>секунду назад</i> ✅ Изменено"
            )
            
            status_toggle_text = "🔄 Скрыть (🔒)" if p.is_active else "🔄 Показать (🌍)"
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💰 Изменить цену", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_price").pack()
                    ),
                    InlineKeyboardButton(
                        text="🏷 Изменить скидку", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_discount").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📦 Изменить остаток", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_stock").pack()
                    ),
                    InlineKeyboardButton(
                        text=status_toggle_text, 
                        callback_data=ProductCallbackFactory(id=product_id, action="toggle_active").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="↩️ Вернуться в каталог", 
                        callback_data=ProductCallbackFactory(id=1, action="page").pack()
                    )
                ]
            ]
            keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
            await message.answer(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error saving discount price for product_id=%s", product_id)
        await message.answer("❌ Произошла ошибка конкурентного доступа при сохранении скидки.")


@admin_router.message(ProductAdmin.waiting_for_stock)
async def process_stock_input(message: Message, state: FSMContext) -> None:
    """
    Processes FSM input for stock level.
    """
    val = message.text.strip()
    if not val.isdigit():
        await message.answer("❌ Ошибка: Введите целое неотрицательное число")
        return

    stock = int(val)
    data = await state.get_data()
    product_id = data["product_id"]
    admin_id = message.from_user.id

    try:
        p = await service.get_product_by_id(product_id)
        if not p:
            await message.answer("❌ Ошибка: Товар не найден.")
            await state.clear()
            return

        old_stock = p.stock
        await service.update_product_stock(product_id, stock)
        
        logger.info(
            "AdminAction: Admin chat_id=%s updated stock for product_id=%s. Old: %s, New: %s",
            admin_id, product_id, old_stock, stock
        )
        await state.clear()
        
        # Show updated detail view as a new message
        p = await service.get_product_by_id(product_id)
        if p:
            status_visible = "🌍 Отображается" if p.is_active else "🔒 Скрыт"
            status_stock = f"🟢 На складе ({p.stock} шт.)" if p.stock > 0 else "🔴 Нет в наличии (0 шт.)"
            
            if p.discount_price is not None and p.price > 0:
                pct = ((p.price - p.discount_price) / p.price) * 100
                disc_price_str = f"🔥 Активна (-{pct:.0f}% / {p.discount_price:.0f} ₽)"
            else:
                disc_price_str = "❌ Выключена"
                
            divider = "────────────────────"
            text = (
                "👑 <b>Панель управления → 📦 Управление товарами → 📝 Карточка товара</b>\n"
                f"{divider}\n"
                f"<b>🛒 Товар:</b> {p.name}\n"
                f"{divider}\n"
                f"🆔 ID товара: <code>#{p.id}</code>\n"
                f"📦 Наличие: {status_stock}\n"
                f"💰 Базовая стоимость: <code>{p.price:.0f} ₽</code>\n"
                f"🏷 Скидка: {disc_price_str}\n"
                f"⚡️ Видимость на сайте: {status_visible}\n\n"
                "⏱ <i>секунду назад</i> ✅ Изменено"
            )
            
            status_toggle_text = "🔄 Скрыть (🔒)" if p.is_active else "🔄 Показать (🌍)"
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💰 Изменить цену", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_price").pack()
                    ),
                    InlineKeyboardButton(
                        text="🏷 Изменить скидку", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_discount").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📦 Изменить остаток", 
                        callback_data=ProductCallbackFactory(id=product_id, action="edit_stock").pack()
                    ),
                    InlineKeyboardButton(
                        text=status_toggle_text, 
                        callback_data=ProductCallbackFactory(id=product_id, action="toggle_active").pack()
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="↩️ Вернуться в каталог", 
                        callback_data=ProductCallbackFactory(id=1, action="page").pack()
                    )
                ]
            ]
            keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
            await message.answer(text, reply_markup=keyboard)
    except Exception as e:
        logger.exception("Error saving stock for product_id=%s", product_id)
        await message.answer("❌ Произошла ошибка конкурентного доступа при сохранении остатка.")
