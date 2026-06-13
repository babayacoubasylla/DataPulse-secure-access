-- DataPulse schema v1 simplifié pour PostgreSQL
-- La version développement utilise SQLite via SQLAlchemy.

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    industry VARCHAR(50) DEFAULT 'mixed',
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(150),
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competitors (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    website_url TEXT,
    industry VARCHAR(50) DEFAULT 'mixed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracked_items (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    target_price NUMERIC(12,2),
    currency VARCHAR(10) DEFAULT 'XOF',
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monitored_urls (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    tracked_item_id INTEGER REFERENCES tracked_items(id) ON DELETE CASCADE,
    competitor_id INTEGER REFERENCES competitors(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    url_type VARCHAR(50) DEFAULT 'product_page',
    refresh_frequency_hours INTEGER DEFAULT 24,
    status VARCHAR(30) DEFAULT 'active',
    last_scraped_at TIMESTAMP,
    next_scrape_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_observations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    tracked_item_id INTEGER REFERENCES tracked_items(id) ON DELETE CASCADE,
    competitor_id INTEGER REFERENCES competitors(id) ON DELETE SET NULL,
    observed_price NUMERIC(12,2) NOT NULL,
    original_price NUMERIC(12,2),
    discount_percentage NUMERIC(5,2),
    currency VARCHAR(10) DEFAULT 'XOF',
    availability_status VARCHAR(50) DEFAULT 'available',
    stock_quantity INTEGER,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    tracked_item_id INTEGER REFERENCES tracked_items(id) ON DELETE SET NULL,
    rule_name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    threshold_value NUMERIC(12,2),
    channel VARCHAR(50) DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_events (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    alert_rule_id INTEGER REFERENCES alert_rules(id) ON DELETE SET NULL,
    tracked_item_id INTEGER REFERENCES tracked_items(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) DEFAULT 'dashboard',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracked_items_org_type ON tracked_items(organization_id, item_type);
CREATE INDEX idx_price_observations_item_time ON price_observations(tracked_item_id, observed_at DESC);
CREATE INDEX idx_monitored_urls_status ON monitored_urls(status, next_scrape_at);
