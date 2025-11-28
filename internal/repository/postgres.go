package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(dsn string) (*PostgresRepository, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	repo := &PostgresRepository{db: db}

	// Initialize schema
	if err := repo.initSchema(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return repo, nil
}

func (r *PostgresRepository) initSchema(ctx context.Context) error {
	schema := `
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
	`

	_, err := r.db.ExecContext(ctx, schema)
	return err
}

// PriceRepository implementation

func (r *PostgresRepository) AddPrice(ctx context.Context, vin string, point marketcheck.PricePoint) error {
	query := `
		INSERT INTO price_history (vin, price, date)
		VALUES ($1, $2, $3)
		ON CONFLICT (vin, date) DO UPDATE SET price = EXCLUDED.price
	`
	_, err := r.db.ExecContext(ctx, query, vin, point.Price, point.Date)
	return err
}

func (r *PostgresRepository) GetHistory(ctx context.Context, vin string) ([]marketcheck.PricePoint, error) {
	query := `
		SELECT price, date
		FROM price_history
		WHERE vin = $1
		ORDER BY date ASC
	`
	rows, err := r.db.QueryContext(ctx, query, vin)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []marketcheck.PricePoint
	for rows.Next() {
		var point marketcheck.PricePoint
		if err := rows.Scan(&point.Price, &point.Date); err != nil {
			return nil, err
		}
		points = append(points, point)
	}
	return points, rows.Err()
}

// ListingRepository implementation

func (r *PostgresRepository) SaveListing(ctx context.Context, listing *marketcheck.EnrichedListing) error {
	listingJSON, err := json.Marshal(listing.Listing)
	if err != nil {
		return fmt.Errorf("failed to marshal listing: %w", err)
	}

	buildJSON, err := json.Marshal(listing.Build)
	if err != nil {
		return fmt.Errorf("failed to marshal build: %w", err)
	}

	valuationJSON, err := json.Marshal(listing.Valuation)
	if err != nil {
		return fmt.Errorf("failed to marshal valuation: %w", err)
	}

	query := `
		INSERT INTO listings (vin, listing_data, build_data, valuation_data)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (vin) DO UPDATE SET
			listing_data = EXCLUDED.listing_data,
			build_data = EXCLUDED.build_data,
			valuation_data = EXCLUDED.valuation_data,
			updated_at = CURRENT_TIMESTAMP
	`
	_, err = r.db.ExecContext(ctx, query, listing.Listing.VIN, listingJSON, buildJSON, valuationJSON)
	return err
}

func (r *PostgresRepository) GetListingByVIN(ctx context.Context, vin string) (*marketcheck.EnrichedListing, error) {
	query := `
		SELECT listing_data, build_data, valuation_data
		FROM listings
		WHERE vin = $1
	`
	var listingJSON, buildJSON, valuationJSON []byte
	err := r.db.QueryRowContext(ctx, query, vin).Scan(&listingJSON, &buildJSON, &valuationJSON)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var listing marketcheck.Listing
	if err := json.Unmarshal(listingJSON, &listing); err != nil {
		return nil, fmt.Errorf("failed to unmarshal listing: %w", err)
	}

	var build marketcheck.Build
	if err := json.Unmarshal(buildJSON, &build); err != nil {
		return nil, fmt.Errorf("failed to unmarshal build: %w", err)
	}

	var valuation marketcheck.Valuation
	if err := json.Unmarshal(valuationJSON, &valuation); err != nil {
		return nil, fmt.Errorf("failed to unmarshal valuation: %w", err)
	}

	return &marketcheck.EnrichedListing{
		Listing:      listing,
		Build:        build,
		PriceHistory: []marketcheck.PricePoint{}, // Will be populated separately if needed
		Valuation:    valuation,
	}, nil
}

func (r *PostgresRepository) GetListings(ctx context.Context, filters ListingFilters) ([]*marketcheck.EnrichedListing, error) {
	query := `
		SELECT listing_data, build_data, valuation_data
		FROM listings
		WHERE 1=1
	`
	args := []interface{}{}
	argPos := 1

	if filters.Make != "" {
		query += fmt.Sprintf(" AND build_data->>'make' ILIKE $%d", argPos)
		args = append(args, filters.Make)
		argPos++
	}

	if filters.Model != "" {
		query += fmt.Sprintf(" AND build_data->>'model' ILIKE $%d", argPos)
		args = append(args, filters.Model)
		argPos++
	}

	query += " ORDER BY updated_at DESC"

	if filters.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argPos)
		args = append(args, filters.Limit)
		argPos++
	}

	if filters.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argPos)
		args = append(args, filters.Offset)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var listings []*marketcheck.EnrichedListing
	for rows.Next() {
		var listingJSON, buildJSON, valuationJSON []byte
		if err := rows.Scan(&listingJSON, &buildJSON, &valuationJSON); err != nil {
			return nil, err
		}

		var listing marketcheck.Listing
		if err := json.Unmarshal(listingJSON, &listing); err != nil {
			continue
		}

		var build marketcheck.Build
		if err := json.Unmarshal(buildJSON, &build); err != nil {
			continue
		}

		var valuation marketcheck.Valuation
		if err := json.Unmarshal(valuationJSON, &valuation); err != nil {
			valuation = marketcheck.Valuation{}
		}

		listings = append(listings, &marketcheck.EnrichedListing{
			Listing:      listing,
			Build:        build,
			PriceHistory: []marketcheck.PricePoint{},
			Valuation:    valuation,
		})
	}

	return listings, rows.Err()
}

func (r *PostgresRepository) Close() error {
	return r.db.Close()
}
