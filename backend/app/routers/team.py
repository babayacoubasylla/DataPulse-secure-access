from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..audit import log_action
from ..database import get_db
from ..models import User
from ..security import get_current_user, hash_password


router = APIRouter(prefix="/api/team", tags=["team"])


ALLOWED_ROLES = {
    "owner",
    "admin",
    "analyst",
    "viewer",
}

MANAGER_ROLES = {
    "owner",
    "admin",
    "platform_admin",
}


class TeamMemberCreate(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=8)
    role: str = "viewer"


class TeamMemberUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class TeamMemberOut(BaseModel):
    id: int
    organization_id: int
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


def ensure_team_manager(current_user: User) -> None:
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Seuls les owners/admins peuvent gérer l’équipe.",
        )


def ensure_valid_role(role: str) -> None:
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Rôle invalide",
        )


@router.get("", response_model=list[TeamMemberOut])
def list_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(User)
        .filter(User.organization_id == current_user.organization_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("", response_model=TeamMemberOut)
def create_team_member(
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_team_manager(current_user)
    ensure_valid_role(payload.role)

    existing = (
        db.query(User)
        .filter(User.email == payload.email.lower())
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Un utilisateur existe déjà avec cet email",
        )

    user = User(
        organization_id=current_user.organization_id,
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )

    db.add(user)
    db.flush()

    log_action(
        db,
        current_user,
        action="team_member_created",
        entity_type="user",
        entity_id=user.id,
        message=f"Membre ajouté: {user.email} ({user.role})",
    )

    db.commit()
    db.refresh(user)

    return user


@router.put("/{user_id}", response_model=TeamMemberOut)
def update_team_member(
    user_id: int,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_team_manager(current_user)

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable",
        )

    data = payload.model_dump(exclude_unset=True)

    if "role" in data and data["role"] is not None:
        ensure_valid_role(data["role"])

        if user.id == current_user.id and data["role"] != current_user.role:
            raise HTTPException(
                status_code=400,
                detail="Tu ne peux pas changer ton propre rôle",
            )

    if (
        "is_active" in data
        and user.id == current_user.id
        and data["is_active"] is False
    ):
        raise HTTPException(
            status_code=400,
            detail="Tu ne peux pas désactiver ton propre compte",
        )

    for key, value in data.items():
        setattr(user, key, value)

    log_action(
        db,
        current_user,
        action="team_member_updated",
        entity_type="user",
        entity_id=user.id,
        message=f"Membre modifié: {user.email}",
    )

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def deactivate_team_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_team_manager(current_user)

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Tu ne peux pas désactiver ton propre compte",
        )

    user.is_active = False

    log_action(
        db,
        current_user,
        action="team_member_deactivated",
        entity_type="user",
        entity_id=user.id,
        message=f"Membre désactivé: {user.email}",
    )

    db.commit()

    return {
        "deactivated": True,
        "id": user_id,
    }