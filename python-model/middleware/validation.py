from pydantic import BaseModel, Field
from typing import List, Optional

class UserInput(BaseModel):
    user_id: int
    favorite_id: List[int] = Field(default_factory=list)
    profile_text: Optional[str] = ""

class RecommendRequest(BaseModel):
    user: UserInput
    top_n: int = Field(ge=1, le=50, default=5)

class TrainRequest(BaseModel):
    modules: list
    users: list
