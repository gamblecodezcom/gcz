from pydantic import BaseModel

class Casino(BaseModel):
    name: str
    category: str
    icon_url: str
    priority: int
    status: str