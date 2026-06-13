from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..alert_engine import evaluate_observation_alerts
from ..database import get_db
from ..models import MonitoredUrl, PriceObservation, User
from ..scraper_utils import scrape_url
from ..security import get_current_user


router = APIRouter(prefix="/api/scraping", tags=["scraping"])


def run_scrape_for_monitored_url(
    db: Session,
    monitored_url: MonitoredUrl,
) -> dict:
    result = scrape_url(monitored_url.url)

    monitored_url.last_scraped_at = datetime.utcnow()

    if result.error:
        monitored_url.status = "failed"
        db.commit()

        return {
            "success": False,
            "monitored_url_id": monitored_url.id,
            "url": monitored_url.url,
            "error": result.error,
            "title": result.title,
            "price": None,
            "currency": result.currency,
            "availability_status": result.availability_status,
            "alerts_created": 0,
        }

    if result.price is None:
        monitored_url.status = "failed"
        db.commit()

        return {
            "success": False,
            "monitored_url_id": monitored_url.id,
            "url": monitored_url.url,
            "error": "Aucun prix détecté sur la page",
            "title": result.title,
            "price": None,
            "currency": result.currency,
            "availability_status": result.availability_status,
            "alerts_created": 0,
        }

    observation = PriceObservation(
        organization_id=monitored_url.organization_id,
        tracked_item_id=monitored_url.tracked_item_id,
        competitor_id=monitored_url.competitor_id,
        observed_price=result.price,
        currency=result.currency,
        availability_status=result.availability_status,
    )

    monitored_url.status = "active"

    db.add(observation)
    db.flush()

    alerts = evaluate_observation_alerts(
        db,
        observation,
    )

    db.commit()
    db.refresh(observation)

    return {
        "success": True,
        "monitored_url_id": monitored_url.id,
        "url": monitored_url.url,
        "title": result.title,
        "price": result.price,
        "raw_price": result.raw_price,
        "currency": result.currency,
        "availability_status": result.availability_status,
        "observation_id": observation.id,
        "observed_at": observation.observed_at,
        "alerts_created": len(alerts),
    }


@router.post("/run-url/{monitored_url_id}")
def run_single_url(
    monitored_url_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitored_url = (
        db.query(MonitoredUrl)
        .filter(
            MonitoredUrl.id == monitored_url_id,
            MonitoredUrl.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not monitored_url:
        raise HTTPException(
            status_code=404,
            detail="URL surveillée introuvable",
        )

    return run_scrape_for_monitored_url(
        db,
        monitored_url,
    )


@router.post("/run-active")
def run_active_urls(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    urls = (
        db.query(MonitoredUrl)
        .filter(
            MonitoredUrl.organization_id == current_user.organization_id,
            MonitoredUrl.status == "active",
        )
        .order_by(MonitoredUrl.last_scraped_at.asc().nullsfirst())
        .limit(limit)
        .all()
    )

    results = []

    for monitored_url in urls:
        results.append(
            run_scrape_for_monitored_url(
                db,
                monitored_url,
            )
        )

    return {
        "count": len(results),
        "results": results,
    }