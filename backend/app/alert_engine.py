from sqlalchemy.orm import Session

from .models import AlertEvent, AlertRule, PriceObservation, TrackedItem


def create_alert_event(
    db: Session,
    organization_id: int,
    tracked_item_id: int | None,
    message: str,
    channel: str = "dashboard",
    alert_rule_id: int | None = None,
) -> AlertEvent:
    alert = AlertEvent(
        organization_id=organization_id,
        alert_rule_id=alert_rule_id,
        tracked_item_id=tracked_item_id,
        message=message,
        channel=channel,
        status="sent",
    )

    db.add(alert)
    db.flush()

    return alert


def evaluate_target_price_alert(
    db: Session,
    observation: PriceObservation,
    tracked_item: TrackedItem,
) -> list[AlertEvent]:
    alerts = []

    if tracked_item.target_price is None:
        return alerts

    observed_price = float(observation.observed_price)
    target_price = float(tracked_item.target_price)

    if observed_price <= target_price:
        message = (
            f"Prix sous cible détecté pour {tracked_item.name} : "
            f"{observed_price:,.0f} {observation.currency} observé, "
            f"cible {target_price:,.0f} {tracked_item.currency}."
        )

        alerts.append(
            create_alert_event(
                db=db,
                organization_id=observation.organization_id,
                tracked_item_id=observation.tracked_item_id,
                message=message,
                channel="dashboard",
            )
        )

    return alerts


def evaluate_custom_rules(
    db: Session,
    observation: PriceObservation,
) -> list[AlertEvent]:
    alerts = []

    rules = (
        db.query(AlertRule)
        .filter(
            AlertRule.organization_id == observation.organization_id,
            AlertRule.is_active == True,  # noqa: E712
        )
        .all()
    )

    observed_price = float(observation.observed_price)

    for rule in rules:
        if (
            rule.tracked_item_id is not None
            and rule.tracked_item_id != observation.tracked_item_id
        ):
            continue

        triggered = False

        if rule.rule_type == "price_below" and rule.threshold_value is not None:
            triggered = observed_price <= float(rule.threshold_value)

        elif rule.rule_type == "price_above" and rule.threshold_value is not None:
            triggered = observed_price >= float(rule.threshold_value)

        elif rule.rule_type == "stock_out":
            triggered = observation.availability_status == "out_of_stock"

        elif rule.rule_type == "stock_available":
            triggered = observation.availability_status == "available"

        if not triggered:
            continue

        message = (
            f"Règle déclenchée: {rule.rule_name}. "
            f"Prix observé: {observed_price:,.0f} {observation.currency}. "
            f"Disponibilité: {observation.availability_status}."
        )

        alerts.append(
            create_alert_event(
                db=db,
                organization_id=observation.organization_id,
                tracked_item_id=observation.tracked_item_id,
                message=message,
                channel=rule.channel or "dashboard",
                alert_rule_id=rule.id,
            )
        )

    return alerts


def evaluate_observation_alerts(
    db: Session,
    observation: PriceObservation,
) -> list[AlertEvent]:
    tracked_item = db.get(TrackedItem, observation.tracked_item_id)

    if not tracked_item:
        return []

    alerts = []

    alerts.extend(
        evaluate_target_price_alert(
            db,
            observation,
            tracked_item,
        )
    )

    alerts.extend(
        evaluate_custom_rules(
            db,
            observation,
        )
    )

    return alerts