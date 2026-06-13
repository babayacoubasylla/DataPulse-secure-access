from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import (
    admin,
    alerts,
    auth,
    billing,
    competitors,
    dashboard,
    monitored_urls,
    observations,
    reports,
    scraping,
    subscriptions,
    team,
    tracked_items,
)
from .seed import seed_if_empty


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    description="API MVP pour DataPulse, plateforme d'intelligence tarifaire multi-secteurs.",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()

    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "product": "DataPulse",
        "status": "API initialisée",
        "environment": settings.app_env,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(dashboard.router)
app.include_router(tracked_items.router)
app.include_router(observations.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(competitors.router)
app.include_router(monitored_urls.router)
app.include_router(subscriptions.router)
app.include_router(team.router)
app.include_router(scraping.router)
app.include_router(admin.router)