from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Organization, User
from ..schemas import AuthResponse, LoginRequest, RegisterRequest, UserOut
from ..security import create_access_token, get_current_user, hash_password, verify_password
from ..subscriptions import ensure_default_subscription


router = APIRouter(prefix="/api/auth", tags=["auth"])


def build_auth_response(user: User) -> AuthResponse:
    token = create_access_token(
        subject=str(user.id),
        extra_data={
            "organization_id": user.organization_id,
            "role": user.role,
        },
    )

    return AuthResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


def get_role_for_new_user(email: str) -> str:
    if (
        settings.platform_admin_email
        and email.lower() == settings.platform_admin_email.lower()
    ):
        return "platform_admin"

    return "owner"


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Un compte existe déjà avec cet email",
        )

    organization = Organization(
        name=payload.organization_name,
        industry=payload.industry,
        email=email,
    )

    db.add(organization)
    db.flush()

    user = User(
        organization_id=organization.id,
        full_name=payload.full_name,
        email=email,
        password_hash=hash_password(payload.password),
        role=get_role_for_new_user(email),
        is_active=True,
    )

    db.add(user)
    db.flush()

    ensure_default_subscription(db, organization.id)

    db.commit()
    db.refresh(user)

    return build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Compte désactivé",
        )

    return build_auth_response(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user