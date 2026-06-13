from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import MonitoredUrl, Subscription, SubscriptionPlan, TrackedItem


DEFAULT_PLANS = [
    {
        "name": "Starter",
        "code": "starter",
        "price_monthly": 25000,
        "currency": "XOF",
        "max_tracked_items": 20,
        "max_monitored_urls": 50,
        "refresh_frequency_hours": 24,
        "email_alerts_enabled": True,
        "whatsapp_alerts_enabled": False,
        "pdf_reports_enabled": False,
        "api_access_enabled": False,
    },
    {
        "name": "Business",
        "code": "business",
        "price_monthly": 100000,
        "currency": "XOF",
        "max_tracked_items": 500,
        "max_monitored_urls": 1500,
        "refresh_frequency_hours": 6,
        "email_alerts_enabled": True,
        "whatsapp_alerts_enabled": True,
        "pdf_reports_enabled": True,
        "api_access_enabled": False,
    },
    {
        "name": "Enterprise",
        "code": "enterprise",
        "price_monthly": 500000,
        "currency": "XOF",
        "max_tracked_items": 1000000,
        "max_monitored_urls": 1000000,
        "refresh_frequency_hours": 1,
        "email_alerts_enabled": True,
        "whatsapp_alerts_enabled": True,
        "pdf_reports_enabled": True,
        "api_access_enabled": True,
    },
]


def seed_subscription_plans(db: Session) -> None:
    for plan_data in DEFAULT_PLANS:
        plan = (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.code == plan_data["code"])
            .first()
        )

        if not plan:
            db.add(SubscriptionPlan(**plan_data))
        else:
            for key, value in plan_data.items():
                setattr(plan, key, value)

    db.commit()


def get_plan_by_code(db: Session, code: str) -> SubscriptionPlan:
    plan = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.code == code)
        .first()
    )

    if not plan:
        seed_subscription_plans(db)

        plan = (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.code == code)
            .first()
        )

    if not plan:
        raise HTTPException(
            status_code=500,
            detail="Plan d’abonnement introuvable",
        )

    return plan


def ensure_default_subscription(
    db: Session,
    organization_id: int,
) -> Subscription:
    subscription = (
        db.query(Subscription)
        .filter(Subscription.organization_id == organization_id)
        .order_by(Subscription.created_at.desc())
        .first()
    )

    if subscription:
        return subscription

    starter = get_plan_by_code(db, "starter")

    subscription = Subscription(
        organization_id=organization_id,
        plan_id=starter.id,
        status="trial",
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return subscription


def get_current_subscription(
    db: Session,
    organization_id: int,
) -> Subscription:
    return ensure_default_subscription(db, organization_id)


def get_usage(db: Session, organization_id: int) -> dict:
    tracked_items_count = (
        db.query(func.count(TrackedItem.id))
        .filter(TrackedItem.organization_id == organization_id)
        .scalar()
        or 0
    )

    monitored_urls_count = (
        db.query(func.count(MonitoredUrl.id))
        .filter(MonitoredUrl.organization_id == organization_id)
        .scalar()
        or 0
    )

    return {
        "tracked_items_count": tracked_items_count,
        "monitored_urls_count": monitored_urls_count,
    }


def assert_can_create_tracked_item(
    db: Session,
    organization_id: int,
) -> None:
    subscription = get_current_subscription(db, organization_id)
    usage = get_usage(db, organization_id)

    if usage["tracked_items_count"] >= subscription.plan.max_tracked_items:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Limite atteinte : votre plan {subscription.plan.name} "
                f"autorise {subscription.plan.max_tracked_items} surveillances."
            ),
        )


def assert_can_create_monitored_url(
    db: Session,
    organization_id: int,
) -> None:
    subscription = get_current_subscription(db, organization_id)
    usage = get_usage(db, organization_id)

    if usage["monitored_urls_count"] >= subscription.plan.max_monitored_urls:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Limite atteinte : votre plan {subscription.plan.name} "
                f"autorise {subscription.plan.max_monitored_urls} URLs surveillées."
            ),
        )