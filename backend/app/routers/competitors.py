from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Competitor, User
from ..security import get_current_user


router = APIRouter(prefix="/api/competitors", tags=["competitors"])


class CompetitorCreate(BaseModel):
    organization_id: int = 1
    name: str
    website_url: str | None = None
    industry: str = "mixed"


class CompetitorUpdate(BaseModel):
    name: str | None = None
    website_url: str | None = None
    industry: str | None = None


class CompetitorOut(CompetitorCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=list[CompetitorOut])
def list_competitors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Competitor)
        .filter(Competitor.organization_id == current_user.organization_id)
        .order_by(Competitor.id.desc())
        .all()
    )


@router.post("", response_model=CompetitorOut)
def create_competitor(
    payload: CompetitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude={"organization_id"})

    competitor = Competitor(
        **data,
        organization_id=current_user.organization_id,
    )

    db.add(competitor)
    db.commit()
    db.refresh(competitor)

    return competitor


@router.put("/{competitor_id}", response_model=CompetitorOut)
def update_competitor(
    competitor_id: int,
    payload: CompetitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competitor = (
        db.query(Competitor)
        .filter(
            Competitor.id == competitor_id,
            Competitor.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not competitor:
        raise HTTPException(
            status_code=404,
            detail="Concurrent introuvable",
        )

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(competitor, key, value)

    db.commit()
    db.refresh(competitor)

    return competitor


@router.delete("/{competitor_id}")
def delete_competitor(
    competitor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competitor = (
        db.query(Competitor)
        .filter(
            Competitor.id == competitor_id,
            Competitor.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not competitor:
        raise HTTPException(
            status_code=404,
            detail="Concurrent introuvable",
        )

    db.delete(competitor)
    db.commit()

    return {
        "deleted": True,
        "id": competitor_id,
    }