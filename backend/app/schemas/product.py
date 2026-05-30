from typing import Optional, List, Dict
from decimal import Decimal
from pydantic import BaseModel, computed_field, ConfigDict

class ProductBase(BaseModel):
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    discount_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    stock: int = 0
    is_active: bool = True
    rating: Optional[float] = 4.8
    reviews_count: Optional[int] = 10
    images: Optional[List[str]] = None
    details: Optional[Dict[str, str]] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def current_price(self) -> Decimal:
        """
        Dynamically calculates the current price, taking discount_price into account
        if it exists and is less than the original price.
        """
        if self.discount_price is not None and self.discount_price < self.price:
            return self.discount_price
        return self.price
