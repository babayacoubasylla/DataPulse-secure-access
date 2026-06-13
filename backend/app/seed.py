from sqlalchemy.orm import Session
from .models import AlertEvent, AlertRule, Competitor, MonitoredUrl, Organization, PriceObservation, TrackedItem

def seed_if_empty(db: Session):
    if db.query(Organization).first():
        return

    org = Organization(name="Demo Market Lab", industry="mixed", email="demo@datapulse.ai")
    db.add(org)
    db.flush()

    competitors = [
        Competitor(organization_id=org.id, name="Jumia CI", website_url="https://jumia.ci", industry="ecommerce"),
        Competitor(organization_id=org.id, name="Agence Premium", website_url="https://example.com", industry="real_estate"),
        Competitor(organization_id=org.id, name="TicketLive", website_url="https://example.com", industry="ticketing"),
    ]
    db.add_all(competitors)
    db.flush()

    items = [
        TrackedItem(organization_id=org.id, item_type="high_tech", name="Samsung Galaxy S24 Ultra", category="smartphone", brand="Samsung", target_price=620000),
        TrackedItem(organization_id=org.id, item_type="real_estate", name="Villa 4 pièces Cocody", category="villa", target_price=90000000),
        TrackedItem(organization_id=org.id, item_type="ticketing", name="Ticket VIP Festival Abidjan", category="concert", target_price=25000),
        TrackedItem(organization_id=org.id, item_type="ecommerce", name="TV Smart 55 pouces", category="tv", brand="LG", target_price=350000),
    ]
    db.add_all(items)
    db.flush()

    urls = [
        MonitoredUrl(organization_id=org.id, tracked_item_id=items[0].id, competitor_id=competitors[0].id, url="https://example.com/s24", refresh_frequency_hours=12),
        MonitoredUrl(organization_id=org.id, tracked_item_id=items[1].id, competitor_id=competitors[1].id, url="https://example.com/villa", url_type="real_estate_listing", refresh_frequency_hours=24),
        MonitoredUrl(organization_id=org.id, tracked_item_id=items[2].id, competitor_id=competitors[2].id, url="https://example.com/ticket", url_type="event_page", refresh_frequency_hours=6),
    ]
    db.add_all(urls)

    observations = [
        PriceObservation(organization_id=org.id, tracked_item_id=items[0].id, competitor_id=competitors[0].id, observed_price=640000, original_price=690000, discount_percentage=7.2, availability_status="available", stock_quantity=12),
        PriceObservation(organization_id=org.id, tracked_item_id=items[1].id, competitor_id=competitors[1].id, observed_price=87500000, availability_status="available"),
        PriceObservation(organization_id=org.id, tracked_item_id=items[2].id, competitor_id=competitors[2].id, observed_price=30000, availability_status="limited_stock", stock_quantity=42),
        PriceObservation(organization_id=org.id, tracked_item_id=items[3].id, competitor_id=competitors[0].id, observed_price=329000, original_price=370000, discount_percentage=11.08, availability_status="available", stock_quantity=8),
    ]
    db.add_all(observations)

    rules = [
        AlertRule(organization_id=org.id, tracked_item_id=items[0].id, rule_name="Baisse smartphone sous cible", rule_type="price_below", threshold_value=620000, channel="whatsapp"),
        AlertRule(organization_id=org.id, tracked_item_id=items[1].id, rule_name="Villa Cocody sous 90M", rule_type="price_below", threshold_value=90000000, channel="email"),
        AlertRule(organization_id=org.id, tracked_item_id=items[2].id, rule_name="Ticket VIP stock faible", rule_type="limited_stock", threshold_value=50, channel="email_and_whatsapp"),
    ]
    db.add_all(rules)
    db.flush()

    events = [
        AlertEvent(organization_id=org.id, alert_rule_id=rules[1].id, tracked_item_id=items[1].id, message="Villa 4 pièces à Cocody détectée sous 90M FCFA", channel="email", status="sent"),
        AlertEvent(organization_id=org.id, alert_rule_id=rules[2].id, tracked_item_id=items[2].id, message="Stock limité sur Ticket VIP Festival Abidjan", channel="whatsapp", status="sent"),
        AlertEvent(organization_id=org.id, alert_rule_id=None, tracked_item_id=items[3].id, message="TV Smart 55 pouces : baisse concurrente de 11%", channel="dashboard", status="sent"),
    ]
    db.add_all(events)
    db.commit()
