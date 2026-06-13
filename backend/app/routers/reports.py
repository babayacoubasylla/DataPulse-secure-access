from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    AlertEvent,
    MonitoredUrl,
    Organization,
    PriceObservation,
    TrackedItem,
    User,
)
from ..security import get_current_user


router = APIRouter(prefix="/api/reports", tags=["reports"])


def serialize_datetime(value):
    return value.isoformat() if value else None


@router.get("/market-summary")
def market_summary_report(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    organization_id = current_user.organization_id
    organization = db.get(Organization, organization_id)

    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)

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

    observations_query = db.query(PriceObservation).filter(
        PriceObservation.organization_id == organization_id,
        PriceObservation.observed_at >= period_start,
        PriceObservation.observed_at <= period_end,
    )

    observations_count = observations_query.count()

    average_price = (
        observations_query
        .with_entities(func.avg(PriceObservation.observed_price))
        .scalar()
        or 0
    )

    min_price = (
        observations_query
        .with_entities(func.min(PriceObservation.observed_price))
        .scalar()
        or 0
    )

    max_price = (
        observations_query
        .with_entities(func.max(PriceObservation.observed_price))
        .scalar()
        or 0
    )

    recent_observations = (
        observations_query
        .order_by(PriceObservation.observed_at.desc())
        .limit(10)
        .all()
    )

    recent_alerts = (
        db.query(AlertEvent)
        .filter(
            AlertEvent.organization_id == organization_id,
            AlertEvent.created_at >= period_start,
            AlertEvent.created_at <= period_end,
        )
        .order_by(AlertEvent.created_at.desc())
        .limit(10)
        .all()
    )

    items_by_id = {
        item.id: item
        for item in db.query(TrackedItem)
        .filter(TrackedItem.organization_id == organization_id)
        .all()
    }

    observations_payload = []

    for observation in recent_observations:
        item = items_by_id.get(observation.tracked_item_id)

        observations_payload.append(
            {
                "id": observation.id,
                "item_name": item.name if item else "Élément inconnu",
                "item_category": item.category if item else None,
                "observed_price": observation.observed_price,
                "currency": observation.currency,
                "availability_status": observation.availability_status,
                "observed_at": serialize_datetime(observation.observed_at),
            }
        )

    alerts_payload = []

    for alert in recent_alerts:
        item = items_by_id.get(alert.tracked_item_id)

        alerts_payload.append(
            {
                "id": alert.id,
                "item_name": item.name if item else "Toutes surveillances",
                "message": alert.message,
                "channel": alert.channel,
                "status": alert.status,
                "created_at": serialize_datetime(alert.created_at),
            }
        )

    recommendations = []

    if observations_count == 0:
        recommendations.append(
            "Aucune observation récente : lancez le scraping ou vérifiez les URLs actives."
        )
    else:
        recommendations.append(
            "Analysez les produits avec prix sous cible pour ajuster votre positionnement."
        )

    if len(recent_alerts) > 0:
        recommendations.append(
            "Traitez les alertes récentes en priorité : elles signalent des mouvements marché importants."
        )

    if monitored_urls_count == 0:
        recommendations.append(
            "Ajoutez des URLs concurrentes pour enrichir la veille tarifaire."
        )

    if not recommendations:
        recommendations.append(
            "Votre veille est active. Continuez à enrichir les sources concurrentielles."
        )

    return {
        "title": "Rapport de veille concurrentielle",
        "generated_at": serialize_datetime(datetime.utcnow()),
        "period": {
            "days": days,
            "start": serialize_datetime(period_start),
            "end": serialize_datetime(period_end),
        },
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "industry": organization.industry,
            "city": organization.city,
            "country": organization.country,
        },
        "summary": {
            "tracked_items_count": tracked_items_count,
            "monitored_urls_count": monitored_urls_count,
            "observations_count": observations_count,
            "alerts_count": len(recent_alerts),
            "average_price": round(float(average_price), 2),
            "min_price": round(float(min_price), 2),
            "max_price": round(float(max_price), 2),
            "currency": "XOF",
        },
        "recent_observations": observations_payload,
        "recent_alerts": alerts_payload,
        "recommendations": recommendations,
    }