from sqlalchemy.orm import Session

from .models import AuditLog, User


def log_action(
    db: Session,
    user: User | None,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    message: str | None = None,
    organization_id: int | None = None,
) -> AuditLog:
    log = AuditLog(
        organization_id=organization_id or (user.organization_id if user else None),
        user_id=user.id if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
    )

    db.add(log)
    db.flush()

    return log