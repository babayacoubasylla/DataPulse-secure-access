from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SubscriptionPlan, User
from ..security import get_current_user
from ..subscriptions import get_current_subscription, get_usage


router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


class SubscriptionPlanOut(BaseModel):
    id: int
    name: str
    code: str
    price_monthly: float
    currency: str
    max_tracked_items: int
    max_monitored_urls: int
    refresh_frequency_hours: int
    email_alerts_enabled: bool
    whatsapp_alerts_enabled: bool
    pdf_reports_enabled: bool
    api_access_enabled: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class SubscriptionOut(BaseModel):
    id: int
    organization_id: int
    plan_id: int
    status: str
    plan: SubscriptionPlanOut

    model_config = ConfigDict(from_attributes=True)


class SubscriptionSummaryOut(BaseModel):
    subscription: SubscriptionOut
    usage: dict


@router.get("/plans", response_model=list[SubscriptionPlanOut])
def list_subscription_plans(db: Session = Depends(get_db)):
    return (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.is_active == True)  # noqa: E712
        .order_by(SubscriptionPlan.price_monthly.asc())
        .all()
    )


@router.get("/current", response_model=SubscriptionSummaryOut)
def current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = get_current_subscription(
        db,
        current_user.organization_id,
    )

    usage = get_usage(
        db,
        current_user.organization_id,
    )

    return {
        "subscription": subscription,
        "usage": usage,
    }