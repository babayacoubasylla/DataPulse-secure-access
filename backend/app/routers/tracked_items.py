from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TrackedItem, User
from ..schemas import TrackedItemCreate, TrackedItemOut, TrackedItemUpdate
from ..security import get_current_user
from ..subscriptions import assert_can_create_tracked_item


router = APIRouter(prefix="/api/tracked-items", tags=["tracked items"])


@router.get("", response_model=list[TrackedItemOut])
def list_tracked_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TrackedItem)
        .filter(TrackedItem.organization_id == current_user.organization_id)
        .order_by(TrackedItem.created_at.desc())
        .all()
    )


@router.post("", response_model=TrackedItemOut)
def create_tracked_item(
    payload: TrackedItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_can_create_tracked_item(db, current_user.organization_id)

    data = payload.model_dump(exclude={"organization_id"})

    item = TrackedItem(
        **data,
        organization_id=current_user.organization_id,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/{item_id}", response_model=TrackedItemOut)
def get_tracked_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == item_id,
            TrackedItem.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Tracked item introuvable",
        )

    return item


@router.put("/{item_id}", response_model=TrackedItemOut)
def update_tracked_item(
    item_id: int,
    payload: TrackedItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == item_id,
            TrackedItem.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Tracked item introuvable",
        )

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{item_id}")
def delete_tracked_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == item_id,
            TrackedItem.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Tracked item introuvable",
        )

    db.delete(item)
    db.commit()

    return {
        "deleted": True,
        "id": item_id,
    }