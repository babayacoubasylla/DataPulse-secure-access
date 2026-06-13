from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TrackedItemCreate(BaseModel):
    organization_id: int = 1
    item_type: str = Field(
        ...,
        examples=["high_tech", "real_estate", "ticketing"],
    )
    name: str
    category: str | None = None
    brand: str | None = None
    target_price: float | None = None
    currency: str = "XOF"


class TrackedItemOut(TrackedItemCreate):
    id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrackedItemUpdate(BaseModel):
    item_type: str | None = None
    name: str | None = None
    category: str | None = None
    brand: str | None = None
    target_price: float | None = None
    currency: str | None = None
    status: str | None = None


class ObservationCreate(BaseModel):
    organization_id: int = 1
    tracked_item_id: int
    competitor_id: int | None = None
    observed_price: float
    original_price: float | None = None
    discount_percentage: float | None = None
    currency: str = "XOF"
    availability_status: str = "available"
    stock_quantity: int | None = None


class ObservationOut(ObservationCreate):
    id: int
    observed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertRuleCreate(BaseModel):
    organization_id: int = 1
    tracked_item_id: int | None = None
    rule_name: str
    rule_type: str
    threshold_value: float | None = None
    channel: str = "email"
    is_active: bool = True


class AlertRuleUpdate(BaseModel):
    tracked_item_id: int | None = None
    rule_name: str | None = None
    rule_type: str | None = None
    threshold_value: float | None = None
    channel: str | None = None
    is_active: bool | None = None


class AlertRuleOut(AlertRuleCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertEventOut(BaseModel):
    id: int
    organization_id: int
    alert_rule_id: int | None
    tracked_item_id: int | None
    message: str
    channel: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MonitoredUrlCreate(BaseModel):
    organization_id: int = 1
    tracked_item_id: int
    competitor_id: int | None = None
    url: str
    url_type: str = "product_page"
    refresh_frequency_hours: int = 24
    status: str = "active"


class MonitoredUrlUpdate(BaseModel):
    tracked_item_id: int | None = None
    competitor_id: int | None = None
    url: str | None = None
    url_type: str | None = None
    refresh_frequency_hours: int | None = None
    status: str | None = None


class MonitoredUrlOut(MonitoredUrlCreate):
    id: int
    last_scraped_at: datetime | None = None
    next_scrape_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    organization_id: int
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    organization_name: str
    industry: str = "mixed"
    full_name: str
    email: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut