from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Organization, SubscriptionPlan, User
from ..security import require_platform_admin
from ..subscriptions import ensure_default_subscription, get_usage


router = APIRouter(prefix="/api/admin", tags=["admin"])


class OrganizationStatusUpdate(BaseModel):
    status: str


class OrganizationPlanUpdate(BaseModel):
    plan_code: str
    subscription_status: str = "active"


@router.get("/organizations")
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    organizations = db.query(Organization).order_by(
        Organization.created_at.desc()
    ).all()

    rows = []

    for organization in organizations:
        subscription = ensure_default_subscription(db, organization.id)
        usage = get_usage(db, organization.id)

        users_count = (
            db.query(User)
            .filter(User.organization_id == organization.id)
            .count()
        )

        rows.append(
            {
                "id": organization.id,
                "name": organization.name,
                "industry": organization.industry,
                "country": organization.country,
                "city": organization.city,
                "email": organization.email,
                "status": organization.status,
                "created_at": organization.created_at,
                "users_count": users_count,
                "usage": usage,
                "subscription": {
                    "id": subscription.id,
                    "status": subscription.status,
                    "plan": {
                        "id": subscription.plan.id,
                        "name": subscription.plan.name,
                        "code": subscription.plan.code,
                        "price_monthly": subscription.plan.price_monthly,
                        "currency": subscription.plan.currency,
                        "max_tracked_items": subscription.plan.max_tracked_items,
                        "max_monitored_urls": subscription.plan.max_monitored_urls,
                    },
                },
            }
        )

    return rows


@router.put("/organizations/{organization_id}/status")
def update_organization_status(
    organization_id: int,
    payload: OrganizationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    allowed_statuses = {
        "active",
        "trial",
        "suspended",
        "cancelled",
        "expired",
    }

    if payload.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Statut invalide",
        )

    organization = db.get(Organization, organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organisation introuvable",
        )

    organization.status = payload.status

    db.commit()
    db.refresh(organization)

    return {
        "updated": True,
        "organization_id": organization.id,
        "status": organization.status,
    }


@router.put("/organizations/{organization_id}/plan")
def update_organization_plan(
    organization_id: int,
    payload: OrganizationPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    organization = db.get(Organization, organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organisation introuvable",
        )

    plan = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.code == payload.plan_code)
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan introuvable",
        )

    subscription = ensure_default_subscription(db, organization.id)

    subscription.plan_id = plan.id
    subscription.status = payload.subscription_status

    db.commit()
    db.refresh(subscription)

    return {
        "updated": True,
        "organization_id": organization.id,
        "plan": plan.code,
        "subscription_status": subscription.status,
    }