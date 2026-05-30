from aiogram.fsm.state import State, StatesGroup

class ProductAdmin(StatesGroup):
    waiting_for_selection = State()
    waiting_for_price = State()
    waiting_for_discount = State()
    waiting_for_stock = State()
