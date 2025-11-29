package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/omerahmer/motor_metrics/internal/config"
	"github.com/omerahmer/motor_metrics/internal/kafka"
	"github.com/omerahmer/motor_metrics/internal/marketcheck"
	"github.com/omerahmer/motor_metrics/internal/producer"
	"github.com/omerahmer/motor_metrics/internal/repository"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.Load()

	if cfg.MarketCheckKey == "" {
		log.Printf("DEBUG: MARKETCHECK_API_KEY env var value: %q", os.Getenv("MARKETCHECK_API_KEY"))
		log.Fatal("MARKETCHECK_API_KEY environment variable is required")
	}
	log.Printf("DEBUG: API key loaded successfully (length: %d)", len(cfg.MarketCheckKey))

	brokers := strings.Split(cfg.KafkaBrokers, ",")
	for i := range brokers {
		brokers[i] = strings.TrimSpace(brokers[i])
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	repo, err := repository.NewPostgresRepository(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer repo.Close()
	log.Println("Connected to PostgreSQL database")

	priceRepo := repo
	listingRepo := repo

	mcClient := marketcheck.NewClientWithURL(cfg.MarketCheckKey, cfg.MarketCheckURL)

	writer := kafka.NewKafkaWriter(brokers, "listings-raw")
	defer writer.Close()

	prod := producer.New(&cfg, mcClient, writer)

	// Setup consumer
	consumer := kafka.NewConsumer(
		brokers,
		"marketcheck-consumer",
		"listings-raw",
		priceRepo,
		listingRepo,
	)
	defer consumer.Close()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start producer in goroutine
	go func() {
		log.Println("producer started...")
		if err := prod.Run(ctx); err != nil {
			log.Printf("producer stopped with error: %v", err)
		}
	}()

	// Start consumer in goroutine
	go func() {
		log.Println("consumer started...")
		if err := consumer.Run(ctx); err != nil {
			log.Printf("consumer stopped with error: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-sigChan
	log.Println("shutting down...")
	cancel()
}
