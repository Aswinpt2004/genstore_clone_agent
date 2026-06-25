from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    stock: int = 100
    image_url: Optional[str] = None

class Store(BaseModel):
    id: str
    name: str
    tagline: str
    category: str
    theme_color: str  # hex color e.g. "#FF6B35"
    created_at: str
    products: List[Product] = []

class GenerateStoreRequest(BaseModel):
    prompt: str

class AddProductRequest(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int = 100
    image_url: Optional[str] = None

class UpdateStoreRequest(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    category: Optional[str] = None
    theme_color: Optional[str] = None

class ChatRequest(BaseModel):
    store_id: str
    message: str

