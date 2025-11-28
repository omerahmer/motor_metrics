package store

import (
	"context"
	"sync"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

// MemoryStore implements PriceStore interface for in-memory storage
type MemoryStore struct {
	mu     sync.RWMutex
	prices map[string][]marketcheck.PricePoint
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		prices: make(map[string][]marketcheck.PricePoint),
	}
}

func (s *MemoryStore) AddPrice(ctx context.Context, vin string, point marketcheck.PricePoint) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.prices[vin] = append(s.prices[vin], point)
	return nil
}

func (s *MemoryStore) GetHistory(ctx context.Context, vin string) ([]marketcheck.PricePoint, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]marketcheck.PricePoint{}, s.prices[vin]...), nil
}

func (s *MemoryStore) Close() error {
	return nil
}

