from pydantic import BaseModel, Field

class GoalBase(BaseModel):
    title: str = Field(..., description="Name of the financial goal")
    current: float = Field(0.0, description="Current amount saved towards goal")
    target: float = Field(..., description="Target amount to reach")

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: str
    user_id: str
