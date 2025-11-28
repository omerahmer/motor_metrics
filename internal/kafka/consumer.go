package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
	"github.com/segmentio/kafka-go"
)

type PriceStore interface {
	AddPrice(ctx context.Context, vin string, p marketcheck.PricePoint) error
	GetHistory(ctx context.Context, vin string) ([]marketcheck.PricePoint, error)
}

type ListingRepository interface {
	SaveListing(ctx context.Context, listing *marketcheck.EnrichedListing) error
}

type Consumer struct {
	reader      *kafka.Reader
	store       PriceStore
	listingRepo ListingRepository
}

func NewConsumer(brokers []string, groupId string, topic string, store PriceStore, listingRepo ListingRepository) *Consumer {
	return &Consumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			GroupID: groupId,
			Topic:   topic,
		}),
		store:       store,
		listingRepo: listingRepo,
	}
}

func (c *Consumer) Run(ctx context.Context) error {
	for {
		m, err := c.reader.FetchMessage(ctx)
		if err != nil {
			log.Println("fetch message error: ", err)
			continue
		}
		var listing marketcheck.EnrichedListing
		if err := json.Unmarshal(m.Value, &listing); err != nil {
			log.Println("json unmarshal error: ", err)
			continue
		}

		vin := listing.Listing.VIN
		var newPoint marketcheck.PricePoint
		if len(listing.PriceHistory) > 0 {
			newPoint = marketcheck.PricePoint{
				Price: listing.Listing.Price,
				Date:  listing.PriceHistory[0].Date,
			}
		} else {
			newPoint = marketcheck.PricePoint{
				Price: listing.Listing.Price,
				Date:  time.Now(),
			}
		}

		if err := c.store.AddPrice(ctx, vin, newPoint); err != nil {
			log.Printf("error adding price for VIN %s: %v", vin, err)
		}
		fullHistory, err := c.store.GetHistory(ctx, vin)
		if err != nil {
			log.Printf("error getting history for VIN %s: %v", vin, err)
			continue
		}

		listing.Valuation = marketcheck.ComputeValuation(fullHistory, listing.Listing.Price)

		// Save enriched listing to database
		if c.listingRepo != nil {
			if err := c.listingRepo.SaveListing(ctx, &listing); err != nil {
				log.Printf("error saving listing to database: %v", err)
			}
		}

		log.Printf("VIN %s: updated valuation score=%.3f good_value=%v\n",
			vin, listing.Valuation.Score, listing.Valuation.IsGoodValue)

		if err := c.reader.CommitMessages(ctx, m); err != nil {
			log.Println("commit error: ", err)
		}
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
