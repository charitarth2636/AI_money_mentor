from pydantic import BaseModel, Field
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float = Field(..., description="Transaction amount in INR")
    category: str = Field(..., description="Category like Food, Rent, Salary")
    description: str = Field("", description="Optional text description")
    date: datetime = Field(default_factory=datetime.utcnow)
    type: str = Field(..., description="income or expense")

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
