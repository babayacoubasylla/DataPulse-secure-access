from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Competitor, PriceObservation, TrackedItem, User
from ..schemas import ObservationCreate, ObservationOut
from ..security import get_current_user


router = APIRouter(prefix="/api/observations", tags=["observations"])


@router.get("", response_model=list[ObservationOut])
def list_observations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PriceObservation)
        .filter(PriceObservation.organization_id == current_user.organization_id)
        .order_by(PriceObservation.observed_at.desc())
        .limit(100)
        .all()
    )


@router.post("", response_model=ObservationOut)
def create_observation(
    payload: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == payload.tracked_item_id,
            TrackedItem.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Surveillance associée introuvable",
        )

    if payload.competitor_id is not None:
        competitor = (
            db.query(Competitor)
            .filter(
                Competitor.id == payload.competitor_id,
                Competitor.organization_id == current_user.organization_id,
            )
            .first()
        )

        if not competitor:
            raise HTTPException(
                status_code=404,
                detail="Concurrent associé introuvable",
            )

    data = payload.model_dump(exclude={"organization_id"})

    observation = PriceObservation(
        **data,
        organization_id=current_user.organization_id,
    )

    db.add(observation)
    db.commit()
    db.refresh(observation)

    return observation