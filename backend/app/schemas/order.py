from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class OrderItemSchema(BaseModel):
    product_id: int = Field(..., description="ID of the product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity of the product being ordered")

class OrderCreateSchema(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255, description="Full name of the customer")
    phone: str = Field(
        ..., 
        pattern=r"^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$",
        description="Customer phone number strictly in the format: +7 (9XX) XXX-XX-XX"
    )
    email: Optional[EmailStr] = Field(None, description="Customer email address (optional)")
    address: str = Field(..., min_length=5, description="Full delivery address")
    items: List[OrderItemSchema] = Field(..., min_length=1, description="List of items in the order")

class CustomOrderCreateSchema(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255, description="Full name of the customer")
    phone: str = Field(
        ..., 
        pattern=r"^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$",
        description="Customer phone number strictly in the format: +7 (9XX) XXX-XX-XX"
    )
    occasion: str = Field(..., min_length=2, description="Occasion for the custom bouquet")
    budget: str = Field(..., description="Budget range selected by user")
    colors: List[str] = Field(..., description="List of preferred colors")
    wishes: Optional[str] = Field(None, description="Detailed wishes or description")
