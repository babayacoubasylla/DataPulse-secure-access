from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Competitor, MonitoredUrl, TrackedItem, User
from ..schemas import MonitoredUrlCreate, MonitoredUrlOut, MonitoredUrlUpdate
from ..security import get_current_user
from ..subscriptions import assert_can_create_monitored_url


router = APIRouter(prefix="/api/monitored-urls", tags=["monitored urls"])


def get_item_for_current_org(
    db: Session,
    item_id: int,
    organization_id: int,
) -> TrackedItem | None:
    return (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == item_id,
            TrackedItem.organization_id == organization_id,
        )
        .first()
    )


def get_competitor_for_current_org(
    db: Session,
    competitor_id: int,
    organization_id: int,
) -> Competitor | None:
    return (
        db.query(Competitor)
        .filter(
            Competitor.id == competitor_id,
            Competitor.organization_id == organization_id,
        )
        .first()
    )


@router.get("", response_model=list[MonitoredUrlOut])
def list_monitored_urls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MonitoredUrl)
        .filter(MonitoredUrl.organization_id == current_user.organization_id)
        .order_by(MonitoredUrl.created_at.desc())
        .all()
    )


@router.post("", response_model=MonitoredUrlOut)
def create_monitored_url(
    payload: MonitoredUrlCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_can_create_monitored_url(db, current_user.organization_id)

    item = get_item_for_current_org(
        db,
        payload.tracked_item_id,
        current_user.organization_id,
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Surveillance associée introuvable",
        )

    if payload.competitor_id is not None:
        competitor = get_competitor_for_current_org(
            db,
            payload.competitor_id,
            current_user.organization_id,
        )

        if not competitor:
            raise HTTPException(
                status_code=404,
                detail="Concurrent associé introuvable",
            )

    data = payload.model_dump(exclude={"organization_id"})

    monitored_url = MonitoredUrl(
        **data,
        organization_id=current_user.organization_id,
    )

    db.add(monitored_url)
    db.commit()
    db.refresh(monitored_url)

    return monitored_url


@router.get("/{url_id}", response_model=MonitoredUrlOut)
def get_monitored_url(
    url_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitored_url = (
        db.query(MonitoredUrl)
        .filter(
            MonitoredUrl.id == url_id,
            MonitoredUrl.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not monitored_url:
        raise HTTPException(
            status_code=404,
            detail="URL surveillée introuvable",
        )

    return monitored_url


@router.put("/{url_id}", response_model=MonitoredUrlOut)
def update_monitored_url(
    url_id: int,
    payload: MonitoredUrlUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitored_url = (
        db.query(MonitoredUrl)
        .filter(
            MonitoredUrl.id == url_id,
            MonitoredUrl.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not monitored_url:
        raise HTTPException(
            status_code=404,
            detail="URL surveillée introuvable",
        )

    data = payload.model_dump(exclude_unset=True)

    if "tracked_item_id" in data and data["tracked_item_id"] is not None:
        item = get_item_for_current_org(
            db,
            data["tracked_item_id"],
            current_user.organization_id,
        )

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Surveillance associée introuvable",
            )

    if "competitor_id" in data and data["competitor_id"] is not None:
        competitor = get_competitor_for_current_org(
            db,
            data["competitor_id"],
            current_user.organization_id,
        )

        if not competitor:
            raise HTTPException(
                status_code=404,
                detail="Concurrent associé introuvable",
            )

    for key, value in data.items():
        setattr(monitored_url, key, value)

    db.commit()
    db.refresh(monitored_url)

    return monitored_url


@router.delete("/{url_id}")
def delete_monitored_url(
    url_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitored_url = (
        db.query(MonitoredUrl)
        .filter(
            MonitoredUrl.id == url_id,
            MonitoredUrl.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not monitored_url:
        raise HTTPException(
            status_code=404,
            detail="URL surveillée introuvable",
        )

    db.delete(monitored_url)
    db.commit()

    return {
        "deleted": True,
        "id": url_id,
    }