"""
Add this entire router to manager_bot.py and it will register as list_orders:

    # After all existing handlers, before dp.include_router lines:
    
from .list_orders import router
dp.include_router(router)  # This registers /list_active, etc.


"""
