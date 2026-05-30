from pydantic import BaseModel, Field
from typing import Optional

class TelegramManagerBase(BaseModel):
    chat_id: int = Field(..., description="Telegram chat identifier")
    username: Optional[str] = Field(None, max_length=100)
    is_active: bool = Field(True)
    role: str = Field(..., max_length=50, description="Role of the manager (florist, courier, admin)")

class TelegramManagerCreate(TelegramManagerBase):
    pass

class TelegramManagerUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, max_length=50)

class TelegramManagerResponse(TelegramManagerBase):
    id: int

    class Config:
        orm_mode = True
