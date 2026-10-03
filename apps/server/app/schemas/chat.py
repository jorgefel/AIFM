import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class AIChatMessageBase(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str
    metadata_json: dict = Field(default_factory=dict)

class AIChatMessageCreate(AIChatMessageBase):
    pass

class AIChatMessageRead(AIChatMessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AIChatSessionBase(BaseModel):
    title: str | None = None
    property_id: uuid.UUID | None = None

class AIChatSessionCreate(AIChatSessionBase):
    pass

class AIChatSessionRead(AIChatSessionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    message_count: int
    created_at: datetime
    updated_at: datetime
    
    # Podría incluir un resumen de los últimos mensajes
    messages: list[AIChatMessageRead] = []
    
    model_config = ConfigDict(from_attributes=True)

class AIChatRequest(BaseModel):
    message: str
    property_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    period: str = "current_month" # ej: current_month, last_month, year_to_date
