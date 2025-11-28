package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/omerahmer/motor_metrics/internal/marketcheck"
	"github.com/segmentio/kafka-go"
)

type Writer interface {
	Write(ctx context.Context, listing marketcheck.EnrichedListing) error
	Close() error
}

type KafkaWriter struct {
	writer *kafka.Writer
}

func NewKafkaWriter(brokers []string, topic string) Writer {
	return &KafkaWriter{
		writer: kafka.NewWriter(kafka.WriterConfig{
			Brokers:  brokers,
			Topic:    topic,
			Balancer: &kafka.LeastBytes{},
			Async:    false,
		}),
	}
}

func (k *KafkaWriter) Write(ctx context.Context, listing marketcheck.EnrichedListing) error {
	b, err := json.Marshal(listing)
	if err != nil {
		log.Println("Failed to marshal listing:", err)
		return err
	}

	return k.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(listing.Listing.VIN),
		Value: b,
		Time:  time.Now(),
	})
}

func (k *KafkaWriter) Close() error {
	return k.writer.Close()
}
