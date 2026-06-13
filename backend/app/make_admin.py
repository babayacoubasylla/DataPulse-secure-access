import sys

from .database import SessionLocal
from .models import User


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.make_admin email@example.com")
        raise SystemExit(1)

    email = sys.argv[1].lower()

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"Utilisateur introuvable: {email}")
            raise SystemExit(1)

        user.role = "platform_admin"

        db.commit()

        print(f"OK: {email} est maintenant platform_admin")

    finally:
        db.close()


if __name__ == "__main__":
    main()