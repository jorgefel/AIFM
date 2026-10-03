import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class AutomationActionBase(BaseModel):
    property_id: uuid.UUID | None = None
    action_type: str = Field(..., max_length=50)
    payload: dict = Field(default_factory=dict)
    status: str = Field(default="draft") # draft, pending_approval, executed, failed, cancelled

class AutomationActionCreate(AutomationActionBase):
    pass

class AutomationActionUpdate(BaseModel):
    status: str
    error_message: str | None = None

class AutomationActionRead(AutomationActionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    error_message: str | None
    executed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    action: str
    details: dict = Field(default_factory=dict)

class AuditLogRead(AuditLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    ip_address: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
