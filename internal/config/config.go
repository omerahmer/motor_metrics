package config

import (
	"os"
	"strconv"
)

type Config struct {
	MarketCheckKey string
	KafkaBrokers   string
	Make           string
	Model          string
	Zip            int
	Radius         int
}

func Load() Config {
	return Config{
		MarketCheckKey: GetString("MARKETCHECK_API_KEY", ""),
		KafkaBrokers:   GetString("KAFKA_BROKERS", "localhost:9092"),
		Make:           GetString("SEARCH_MAKE", "ford"),
		Model:          GetString("SEARCH_MODEL", "f-150"),
		Zip:            GetInt("SEARCH_ZIP", 92617),
		Radius:         GetInt("SEARCH_RADIUS", 50),
	}
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
