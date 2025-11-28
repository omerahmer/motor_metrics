package repository

import (
	"context"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

// PriceRepository handles price history operations
type PriceRepository interface {
	AddPrice(ctx context.Context, vin string, point marketcheck.PricePoint) error
	GetHistory(ctx context.Context, vin string) ([]marketcheck.PricePoint, error)
	Close() error
}

// ListingRepository handles listing operations
type ListingRepository interface {
	SaveListing(ctx context.Context, listing *marketcheck.EnrichedListing) error
	GetListingByVIN(ctx context.Context, vin string) (*marketcheck.EnrichedListing, error)
	GetListings(ctx context.Context, filters ListingFilters) ([]*marketcheck.EnrichedListing, error)
	Close() error
}

// ListingFilters for querying listings
type ListingFilters struct {
	Make   string
	Model  string
	Zip    string
	Radius int
	Limit  int
	Offset int
}
