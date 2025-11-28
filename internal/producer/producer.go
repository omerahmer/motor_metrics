package producer

import (
	"context"
	"time"

	"github.com/omerahmer/motor_metrics/internal/config"
	"github.com/omerahmer/motor_metrics/internal/kafka"
	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

type Producer struct {
	cfg      *config.Config
	client   *marketcheck.Client
	writer   kafka.Writer
	interval time.Duration
}

func New(cfg *config.Config, client *marketcheck.Client, writer kafka.Writer) *Producer {
	return &Producer{
		cfg:      cfg,
		client:   client,
		writer:   writer,
		interval: time.Minute,
	}
}

func (p *Producer) Run(ctx context.Context) error {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			_ = p.ingestOnce(ctx)
		}
	}
}

func (p *Producer) ingestOnce(ctx context.Context) error {
	listings, err := p.client.FetchActiveListings(ctx, 100)
	if err != nil {
		return err
	}

	for _, listing := range listings {
		build, err := p.client.FetchBuild(ctx, listing.VIN)
		if err != nil {
			continue
		}

		priceSnapshot := marketcheck.PricePoint{
			Price: listing.Price,
			Date:  time.Now(),
		}

		enriched := marketcheck.EnrichedListing{
			Listing:      listing,
			Build:        *build,
			PriceHistory: []marketcheck.PricePoint{priceSnapshot},
			Valuation:    marketcheck.Valuation{},
		}

		_ = p.writer.Write(ctx, enriched)
	}
	return nil
}
