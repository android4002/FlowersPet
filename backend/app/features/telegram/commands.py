# Admin commands for FlowersPET Telegram Bot
# These register the /list_orders command system

from aiogram import Router, F


async def register_commands(bot):
    """Register admin panel commands for all managers"""
    await bot.set_my_commands(
        commands=[
            {
                "command": "start",
                "description": "Начать работу"
                {"command": "status", "description": "Статус заказов"}, 
                {"command": "list_orders", "description": "Список всех заказов"}  
            }
        ]
    )
