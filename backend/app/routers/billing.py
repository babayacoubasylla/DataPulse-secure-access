from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..audit import log_action
from ..database import get_db
from ..models import BillingInvoice, Organization, Payment, User
from ..security import get_current_user, require_platform_admin


router = APIRouter(prefix="/api/billing", tags=["billing"])


class InvoiceCreate(BaseModel):
    organization_id: int
    amount: float
    currency: str = "XOF"
    due_in_days: int = 7
    notes: str | None = None


class InvoiceStatusUpdate(BaseModel):
    status: str


class InvoiceMarkPaid(BaseModel):
    provider: str = "manual"
    transaction_reference: str | None = None


def make_invoice_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(func.count(BillingInvoice.id)).scalar() or 0

    return f"DP-{year}-{count + 1:05d}"


def invoice_payload(invoice: BillingInvoice) -> dict:
    return {
        "id": invoice.id,
        "organization_id": invoice.organization_id,
        "organization_name": invoice.organization.name if invoice.organization else None,
        "invoice_number": invoice.invoice_number,
        "amount": invoice.amount,
        "currency": invoice.currency,
        "status": invoice.status,
        "notes": invoice.notes,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
        "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
    }


@router.get("/invoices")
def list_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoices = (
        db.query(BillingInvoice)
        .filter(BillingInvoice.organization_id == current_user.organization_id)
        .order_by(BillingInvoice.created_at.desc())
        .all()
    )

    return [invoice_payload(invoice) for invoice in invoices]


@router.get("/admin/summary")
def billing_admin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    total_invoiced = db.query(func.sum(BillingInvoice.amount)).scalar() or 0

    total_paid = (
        db.query(func.sum(BillingInvoice.amount))
        .filter(BillingInvoice.status == "paid")
        .scalar()
        or 0
    )

    total_unpaid = (
        db.query(func.sum(BillingInvoice.amount))
        .filter(BillingInvoice.status.in_(["unpaid", "overdue"]))
        .scalar()
        or 0
    )

    invoices_count = db.query(func.count(BillingInvoice.id)).scalar() or 0

    return {
        "total_invoiced": float(total_invoiced),
        "total_paid": float(total_paid),
        "total_unpaid": float(total_unpaid),
        "invoices_count": invoices_count,
        "currency": "XOF",
    }


@router.get("/admin/invoices")
def list_all_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    invoices = (
        db.query(BillingInvoice)
        .order_by(BillingInvoice.created_at.desc())
        .all()
    )

    return [invoice_payload(invoice) for invoice in invoices]


@router.post("/admin/invoices")
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    organization = db.get(Organization, payload.organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organisation introuvable",
        )

    invoice = BillingInvoice(
        organization_id=organization.id,
        invoice_number=make_invoice_number(db),
        amount=payload.amount,
        currency=payload.currency,
        status="unpaid",
        notes=payload.notes,
        due_date=datetime.utcnow() + timedelta(days=payload.due_in_days),
    )

    db.add(invoice)
    db.flush()

    log_action(
        db,
        current_user,
        action="invoice_created",
        entity_type="billing_invoice",
        entity_id=invoice.id,
        organization_id=organization.id,
        message=f"Facture {invoice.invoice_number} créée pour {organization.name}",
    )

    db.commit()
    db.refresh(invoice)

    return invoice_payload(invoice)


@router.put("/admin/invoices/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    payload: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    allowed = {
        "unpaid",
        "paid",
        "overdue",
        "cancelled",
    }

    if payload.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Statut invalide",
        )

    invoice = db.get(BillingInvoice, invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Facture introuvable",
        )

    invoice.status = payload.status

    if payload.status == "paid" and invoice.paid_at is None:
        invoice.paid_at = datetime.utcnow()

    log_action(
        db,
        current_user,
        action="invoice_status_updated",
        entity_type="billing_invoice",
        entity_id=invoice.id,
        organization_id=invoice.organization_id,
        message=f"Statut facture {invoice.invoice_number}: {payload.status}",
    )

    db.commit()
    db.refresh(invoice)

    return invoice_payload(invoice)


@router.put("/admin/invoices/{invoice_id}/mark-paid")
def mark_invoice_paid(
    invoice_id: int,
    payload: InvoiceMarkPaid,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    invoice = db.get(BillingInvoice, invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Facture introuvable",
        )

    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()

    payment = Payment(
        organization_id=invoice.organization_id,
        invoice_id=invoice.id,
        provider=payload.provider,
        amount=invoice.amount,
        currency=invoice.currency,
        status="paid",
        transaction_reference=payload.transaction_reference,
    )

    db.add(payment)
    db.flush()

    log_action(
        db,
        current_user,
        action="invoice_paid",
        entity_type="billing_invoice",
        entity_id=invoice.id,
        organization_id=invoice.organization_id,
        message=f"Facture {invoice.invoice_number} marquée comme payée",
    )

    db.commit()
    db.refresh(invoice)

    return invoice_payload(invoice)