from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AlertEvent, MonitoredUrl, PriceObservation, TrackedItem, User
from ..security import get_current_user


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    organization_id = current_user.organization_id

    items_count = (
        db.query(func.count(TrackedItem.id))
        .filter(TrackedItem.organization_id == organization_id)
        .scalar()
        or 0
    )

    urls_count = (
        db.query(func.count(MonitoredUrl.id))
        .filter(MonitoredUrl.organization_id == organization_id)
        .scalar()
        or 0
    )

    alerts_count = (
        db.query(func.count(AlertEvent.id))
        .filter(AlertEvent.organization_id == organization_id)
        .scalar()
        or 0
    )

    avg_price = (
        db.query(func.avg(PriceObservation.observed_price))
        .filter(PriceObservation.organization_id == organization_id)
        .scalar()
        or 0
    )

    sectors = []

    for key, label in [
        ("ecommerce", "E-commerce"),
        ("high_tech", "High-Tech"),
        ("real_estate", "Immobilier"),
        ("ticketing", "Billetterie"),
    ]:
        count = (
            db.query(func.count(TrackedItem.id))
            .filter(
                TrackedItem.organization_id == organization_id,
                TrackedItem.item_type == key,
            )
            .scalar()
            or 0
        )

        sectors.append(
            {
                "key": key,
                "name": label,
                "score": min(95, 68 + count * 6),
                "change": round((count * 2.7) - 4.2, 1),
            }
        )

    return {
        "competitiveness_score": 82,
        "currency": "XOF",
        "items_tracked": items_count,
        "urls_monitored": urls_count,
        "alerts_today": alerts_count,
        "average_observed_price": round(float(avg_price), 2),
        "market_shift": -3.8,
        "sectors": sectors,
    }