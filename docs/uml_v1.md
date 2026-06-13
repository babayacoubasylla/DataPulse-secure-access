# DataPulse V1 — Diagrammes UML et architecture

Ce document décrit la version V1 présentable de DataPulse.

## 1. Use Case Diagram

```mermaid
flowchart LR
    Client[Client B2B / Organisation]
    Owner[Owner / Admin client]
    Analyst[Analyste / Viewer]
    PlatformAdmin[Propriétaire DataPulse / Platform Admin]
    Worker[Worker Scraping]

    subgraph DataPulse[Plateforme DataPulse V1]
        UC1[Créer un compte / se connecter]
        UC2[Gérer surveillances]
        UC3[Gérer concurrents / sources]
        UC4[Gérer URLs surveillées]
        UC5[Lancer scraping manuel]
        UC6[Consulter observations de prix]
        UC7[Créer règles d'alerte]
        UC8[Consulter alertes]
        UC9[Générer rapport PDF / HTML]
        UC10[Consulter abonnement et factures]
        UC11[Gérer équipe]
        UC12[Configurer WhatsApp Ops]
        UC13[Gérer clients]
        UC14[Gérer plans / statuts]
        UC15[Gérer factures admin]
    end

    Client --> UC1
    Owner --> UC2
    Owner --> UC3
    Owner --> UC4
    Owner --> UC7
    Owner --> UC9
    Owner --> UC10
    Owner --> UC11
    Owner --> UC12
    Analyst --> UC5
    Analyst --> UC6
    Analyst --> UC8
    Worker --> UC5
    UC5 --> UC6
    UC5 --> UC8
    PlatformAdmin --> UC13
    PlatformAdmin --> UC14
    PlatformAdmin --> UC15
```

## 2. Class Diagram

```mermaid
classDiagram
    class Organization {
      int id
      string name
      string industry
      string country
      string city
      string email
      string status
      datetime created_at
    }

    class User {
      int id
      int organization_id
      string full_name
      string email
      string password_hash
      string role
      bool is_active
    }

    class SubscriptionPlan {
      int id
      string name
      string code
      float price_monthly
      int max_tracked_items
      int max_monitored_urls
      int refresh_frequency_hours
      bool whatsapp_alerts_enabled
      bool pdf_reports_enabled
      bool api_access_enabled
    }

    class Subscription {
      int id
      int organization_id
      int plan_id
      string status
      datetime started_at
      datetime expires_at
    }

    class TrackedItem {
      int id
      int organization_id
      string item_type
      string name
      string category
      string brand
      float target_price
      string currency
      string status
    }

    class Competitor {
      int id
      int organization_id
      string name
      string website_url
      string industry
    }

    class MonitoredUrl {
      int id
      int organization_id
      int tracked_item_id
      int competitor_id
      string url
      string url_type
      int refresh_frequency_hours
      string status
      datetime last_scraped_at
      datetime next_scrape_at
    }

    class PriceObservation {
      int id
      int organization_id
      int tracked_item_id
      int competitor_id
      float observed_price
      string currency
      string availability_status
      datetime observed_at
    }

    class AlertRule {
      int id
      int organization_id
      int tracked_item_id
      string rule_name
      string rule_type
      float threshold_value
      string channel
      bool is_active
    }

    class AlertEvent {
      int id
      int organization_id
      int alert_rule_id
      int tracked_item_id
      string message
      string channel
      string status
      datetime created_at
    }

    class BillingInvoice {
      int id
      int organization_id
      string invoice_number
      float amount
      string currency
      string status
      datetime due_date
      datetime paid_at
    }

    class Payment {
      int id
      int organization_id
      int invoice_id
      string provider
      float amount
      string status
      string transaction_reference
    }

    class AuditLog {
      int id
      int organization_id
      int user_id
      string action
      string entity_type
      int entity_id
      string message
    }

    Organization "1" --> "many" User
    Organization "1" --> "many" TrackedItem
    Organization "1" --> "many" Competitor
    Organization "1" --> "many" MonitoredUrl
    Organization "1" --> "many" PriceObservation
    Organization "1" --> "many" AlertRule
    Organization "1" --> "many" AlertEvent
    Organization "1" --> "many" BillingInvoice
    Organization "1" --> "many" Payment
    Organization "1" --> "many" AuditLog
    SubscriptionPlan "1" --> "many" Subscription
    Organization "1" --> "many" Subscription
    TrackedItem "1" --> "many" MonitoredUrl
    Competitor "1" --> "many" MonitoredUrl
    TrackedItem "1" --> "many" PriceObservation
    Competitor "1" --> "many" PriceObservation
    AlertRule "1" --> "many" AlertEvent
    BillingInvoice "1" --> "many" Payment
```

## 3. Sequence Diagram — Scraping

```mermaid
sequenceDiagram
    actor User as Utilisateur connecté
    participant React as Frontend React
    participant API as FastAPI
    participant DB as Base de données
    participant Scraper as Scraper Utils
    participant Alerts as Alert Engine

    User->>React: Clique "Scraper"
    React->>API: POST /api/scraping/run-url/{id}
    API->>DB: Vérifie URL appartient à organisation
    DB-->>API: MonitoredUrl
    API->>Scraper: scrape_url(url)
    Scraper-->>API: title, price, currency, availability
    API->>DB: Crée PriceObservation
    API->>Alerts: evaluate_observation_alerts()
    Alerts->>DB: Lit TrackedItem + AlertRules
    Alerts->>DB: Crée AlertEvent si règle déclenchée
    API->>DB: Met à jour last_scraped_at/status
    API-->>React: Résultat scraping + alerts_created
    React->>API: Recharge observations / alertes
    React-->>User: Affiche prix et alerte
```

## 4. Sequence Diagram — Abonnement / Facturation

```mermaid
sequenceDiagram
    actor Admin as Platform Admin
    actor Client as Client B2B
    participant React as Frontend React
    participant API as FastAPI
    participant DB as Base de données

    Admin->>React: Ouvre Admin Billing
    React->>API: GET /api/admin/organizations
    React->>API: GET /api/billing/admin/invoices
    React->>API: GET /api/billing/admin/summary
    API->>DB: Lit organisations, factures, paiements
    DB-->>API: Données admin
    API-->>React: Résumé financier

    Admin->>React: Crée facture
    React->>API: POST /api/billing/admin/invoices
    API->>DB: Crée BillingInvoice
    API->>DB: Crée AuditLog invoice_created
    API-->>React: Facture créée

    Admin->>React: Marque facture payée
    React->>API: PUT /api/billing/admin/invoices/{id}/mark-paid
    API->>DB: Met facture paid
    API->>DB: Crée Payment
    API->>DB: Crée AuditLog invoice_paid
    API-->>React: Facture payée

    Client->>React: Ouvre Factures
    React->>API: GET /api/billing/invoices
    API->>DB: Filtre factures par organization_id
    API-->>React: Factures client
```

## 5. Architecture Diagram

```mermaid
flowchart TB
    Browser[Navigateur utilisateur]
    React[Frontend React / Vite]
    API[Backend FastAPI]
    Auth[JWT Auth + Roles]
    DB[(SQLite Dev / PostgreSQL Prod)]
    Scraper[Scraper V1]
    AlertEngine[Alert Engine]
    Reports[Reports HTML/PDF]
    Admin[Admin Console]
    Billing[Billing manuel]

    Browser --> React
    React --> API
    API --> Auth
    API --> DB
    API --> Scraper
    API --> AlertEngine
    API --> Reports
    API --> Admin
    API --> Billing
    Scraper --> DB
    AlertEngine --> DB
    Billing --> DB
    Reports --> DB

    subgraph Future[V2 / Production]
      PG[(PostgreSQL)]
      Redis[(Redis Queue)]
      Workers[Celery / Playwright Workers]
      Email[SMTP / Email Provider]
      WhatsApp[Meta Cloud API / Twilio]
      Payments[CinetPay / PayDunya / Flutterwave]
    end

    API -. migration .-> PG
    API -. jobs .-> Redis
    Redis -. tasks .-> Workers
    Workers -. observations .-> PG
    API -. notifications .-> Email
    API -. whatsapp .-> WhatsApp
    API -. online payments .-> Payments
```

## 6. Périmètre V1 présentable

- Authentification et inscription
- Multi-tenant par organisation
- Gestion surveillances
- Gestion concurrents et URLs
- Scraping manuel V1
- Observations de prix
- Alertes automatiques et règles d’alerte
- Rapports HTML exportables PDF
- Abonnements Starter / Business / Enterprise
- Facturation manuelle
- Admin Console
- Gestion équipe V1
- WhatsApp Ops préconfiguré

## 7. Limites connues V1

- Scraping V1 limité aux pages HTML simples
- WhatsApp non encore connecté à une API réelle
- Paiement en ligne non encore connecté
- SQLite adapté au développement, PostgreSQL recommandé en production
- Pas encore de scheduler automatique permanent
- Pas encore de reset password email