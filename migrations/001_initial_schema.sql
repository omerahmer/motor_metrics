-- Initial schema for motor_metrics database
-- This is automatically created by the repository, but kept here for reference

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    price INTEGER NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vin, date)
);

CREATE INDEX IF NOT EXISTS idx_price_history_vin ON price_history(vin);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);

CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    listing_data JSONB NOT NULL,
    build_data JSONB NOT NULL,
    valuation_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_vin ON listings(vin);
CREATE INDEX IF NOT EXISTS idx_listings_listing_data ON listings USING GIN(listing_data);
CREATE INDEX IF NOT EXISTS idx_listings_build_data ON listings USING GIN(build_data);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

