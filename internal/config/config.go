package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	MarketCheckKey   string
	MarketCheckURL   string
	KafkaBrokers     string
	Make             string
	Model            string
	Zip              int
	Radius           int
	DatabaseURL      string
	DatabaseHost     string
	DatabasePort     int
	DatabaseName     string
	DatabaseUser     string
	DatabasePassword string
	DatabaseSSLMode  string
}

func Load() Config {
	cfg := Config{
		MarketCheckKey:   GetString("MARKETCHECK_API_KEY", ""),
		MarketCheckURL:   GetString("MARKETCHECK_BASE_URL", "https://marketcheck-prod.apigee.net/v1"),
		KafkaBrokers:     GetString("KAFKA_BROKERS", "localhost:9092"),
		Make:             GetString("SEARCH_MAKE", "ford"),
		Model:            GetString("SEARCH_MODEL", "f-150"),
		Zip:              GetInt("SEARCH_ZIP", 92617),
		Radius:           GetInt("SEARCH_RADIUS", 50),
		DatabaseURL:      GetString("DATABASE_URL", ""),
		DatabaseHost:     GetString("DATABASE_HOST", "localhost"),
		DatabasePort:     GetInt("DATABASE_PORT", 5432),
		DatabaseName:     GetString("DATABASE_NAME", "motor_metrics"),
		DatabaseUser:     GetString("DATABASE_USER", "postgres"),
		DatabasePassword: GetString("DATABASE_PASSWORD", ""),
		DatabaseSSLMode:  GetString("DATABASE_SSLMODE", "disable"),
	}

	// Build DATABASE_URL if not provided
	if cfg.DatabaseURL == "" {
		cfg.DatabaseURL = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			cfg.DatabaseHost, cfg.DatabasePort, cfg.DatabaseUser, cfg.DatabasePassword, cfg.DatabaseName, cfg.DatabaseSSLMode)
	}

	return cfg
}

func GetString(key, fallback string) string {
	val, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	return val
}

func GetInt(key string, fallback int) int {
	val, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	valAsInt, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return valAsInt
}
