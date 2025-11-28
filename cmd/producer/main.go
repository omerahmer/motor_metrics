package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/omerahmer/motor_metrics/internal/config"
	"github.com/omerahmer/motor_metrics/internal/marketcheck"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigchan
		cancel()
	}()

	client := marketcheck.NewClient(cfg.MarketCheckKey)
}
