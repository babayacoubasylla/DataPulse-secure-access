from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AlertEvent, AlertRule, TrackedItem, User
from ..schemas import AlertEventOut, AlertRuleCreate, AlertRuleOut, AlertRuleUpdate
from ..security import get_current_user


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def ensure_item_belongs_to_current_org(
    db: Session,
    tracked_item_id: int | None,
    organization_id: int,
) -> None:
    if tracked_item_id is None:
        return

    item = (
        db.query(TrackedItem)
        .filter(
            TrackedItem.id == tracked_item_id,
            TrackedItem.organization_id == organization_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Surveillance associée introuvable",
        )


@router.get("", response_model=list[AlertEventOut])
def list_alert_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AlertEvent)
        .filter(AlertEvent.organization_id == current_user.organization_id)
        .order_by(AlertEvent.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/rules", response_model=list[AlertRuleOut])
def list_alert_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AlertRule)
        .filter(AlertRule.organization_id == current_user.organization_id)
        .order_by(AlertRule.created_at.desc())
        .all()
    )


@router.post("/rules", response_model=AlertRuleOut)
def create_alert_rule(
    payload: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_item_belongs_to_current_org(
        db,
        payload.tracked_item_id,
        current_user.organization_id,
    )

    data = payload.model_dump(exclude={"organization_id"})

    rule = AlertRule(
        **data,
        organization_id=current_user.organization_id,
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


@router.put("/rules/{rule_id}", response_model=AlertRuleOut)
def update_alert_rule(
    rule_id: int,
    payload: AlertRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = (
        db.query(AlertRule)
        .filter(
            AlertRule.id == rule_id,
            AlertRule.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Règle d’alerte introuvable",
        )

    data = payload.model_dump(exclude_unset=True)

    if "tracked_item_id" in data:
        ensure_item_belongs_to_current_org(
            db,
            data["tracked_item_id"],
            current_user.organization_id,
        )

    for key, value in data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)

    return rule


@router.delete("/rules/{rule_id}")
def delete_alert_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = (
        db.query(AlertRule)
        .filter(
            AlertRule.id == rule_id,
            AlertRule.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Règle d’alerte introuvable",
        )

    db.delete(rule)
    db.commit()

    return {
        "deleted": True,
        "id": rule_id,
    }