package cache

import (
	"sync"
	"time"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

type Cache struct {
	builds      map[string]*CachedBuild
	buildsMutex sync.RWMutex
	ttl         time.Duration
}

type CachedBuild struct {
	Build     *marketcheck.Build
	ExpiresAt time.Time
}

func NewCache(ttl time.Duration) *Cache {
	c := &Cache{
		builds: make(map[string]*CachedBuild),
		ttl:    ttl,
	}
	go c.cleanup()
	return c
}

func (c *Cache) GetBuild(vin string) (*marketcheck.Build, bool) {
	c.buildsMutex.RLock()
	defer c.buildsMutex.RUnlock()

	cached, exists := c.builds[vin]
	if !exists {
		return nil, false
	}

	if time.Now().After(cached.ExpiresAt) {
		return nil, false
	}

	return cached.Build, true
}

func (c *Cache) SetBuild(vin string, build *marketcheck.Build) {
	c.buildsMutex.Lock()
	defer c.buildsMutex.Unlock()

	c.builds[vin] = &CachedBuild{
		Build:     build,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

func (c *Cache) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.buildsMutex.Lock()
		now := time.Now()
		for vin, cached := range c.builds {
			if now.After(cached.ExpiresAt) {
				delete(c.builds, vin)
			}
		}
		c.buildsMutex.Unlock()
	}
}
