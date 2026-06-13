from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    industry: Mapped[str] = mapped_column(String(50), default="mixed")
    country: Mapped[str] = mapped_column(String(100), default="Côte d'Ivoire")
    city: Mapped[str] = mapped_column(String(100), default="Abidjan")
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tracked_items = relationship(
        "TrackedItem",
        back_populates="organization",
        cascade="all, delete-orphan",
    )


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    price_monthly: Mapped[float] = mapped_column(Float, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="XOF")

    max_tracked_items: Mapped[int] = mapped_column(Integer, default=20)
    max_monitored_urls: Mapped[int] = mapped_column(Integer, default=50)
    refresh_frequency_hours: Mapped[int] = mapped_column(Integer, default=24)

    email_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    whatsapp_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    pdf_reports_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    api_access_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("subscription_plans.id"),
        index=True,
    )

    status: Mapped[str] = mapped_column(String(30), default="trial")
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization")
    plan = relationship("SubscriptionPlan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="owner")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization")


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    website_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str] = mapped_column(String(50), default="mixed")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class TrackedItem(Base):
    __tablename__ = "tracked_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    item_type: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="XOF")
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization", back_populates="tracked_items")
    monitored_urls = relationship(
        "MonitoredUrl",
        back_populates="tracked_item",
        cascade="all, delete-orphan",
    )
    observations = relationship(
        "PriceObservation",
        back_populates="tracked_item",
        cascade="all, delete-orphan",
    )


class MonitoredUrl(Base):
    __tablename__ = "monitored_urls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    tracked_item_id: Mapped[int] = mapped_column(
        ForeignKey("tracked_items.id"),
        index=True,
    )
    competitor_id: Mapped[int | None] = mapped_column(
        ForeignKey("competitors.id"),
        nullable=True,
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    url_type: Mapped[str] = mapped_column(String(50), default="product_page")
    refresh_frequency_hours: Mapped[int] = mapped_column(Integer, default=24)
    status: Mapped[str] = mapped_column(String(30), default="active")
    last_scraped_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_scrape_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tracked_item = relationship("TrackedItem", back_populates="monitored_urls")


class PriceObservation(Base):
    __tablename__ = "price_observations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    tracked_item_id: Mapped[int] = mapped_column(
        ForeignKey("tracked_items.id"),
        index=True,
    )
    competitor_id: Mapped[int | None] = mapped_column(
        ForeignKey("competitors.id"),
        nullable=True,
    )
    observed_price: Mapped[float] = mapped_column(Float, nullable=False)
    original_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    discount_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="XOF")
    availability_status: Mapped[str] = mapped_column(String(50), default="available")
    stock_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observed_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        index=True,
    )

    tracked_item = relationship("TrackedItem", back_populates="observations")


# ========== NOUVEAUX MODÈLES AJOUTÉS ==========

class BillingInvoice(Base):
    __tablename__ = "billing_invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)

    invoice_number: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        index=True,
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XOF")
    status: Mapped[str] = mapped_column(String(30), default="unpaid")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("billing_invoices.id"), index=True)

    provider: Mapped[str] = mapped_column(String(80), default="manual")
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XOF")
    status: Mapped[str] = mapped_column(String(30), default="paid")
    transaction_reference: Mapped[str | None] = mapped_column(String(150), nullable=True)

    paid_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization")
    invoice = relationship("BillingInvoice")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    organization = relationship("Organization")
    user = relationship("User")


# ========== FIN DES NOUVEAUX MODÈLES ==========

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    tracked_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("tracked_items.id"),
        nullable=True,
    )
    rule_name: Mapped[str] = mapped_column(String(150), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    channel: Mapped[str] = mapped_column(String(50), default="email")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        index=True,
    )
    alert_rule_id: Mapped[int | None] = mapped_column(
        ForeignKey("alert_rules.id"),
        nullable=True,
    )
    tracked_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("tracked_items.id"),
        nullable=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default="dashboard")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())