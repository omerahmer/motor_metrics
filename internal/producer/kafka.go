package producer

import (
	"context"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

type Writer interface {
	Write(ctx context.Context, listing marketcheck.EnrichedListing) error
}

type KafkaWriter struct{}
