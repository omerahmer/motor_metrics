package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/omerahmer/motor_metrics/internal/cache"
	"github.com/omerahmer/motor_metrics/internal/config"
	"github.com/omerahmer/motor_metrics/internal/marketcheck"
	"github.com/omerahmer/motor_metrics/internal/ratelimit"
	"github.com/omerahmer/motor_metrics/internal/repository"
)

type SearchRequest struct {
	Make   string `json:"make"`
	Model  string `json:"model"`
	Zip    string `json:"zip"`
	Radius int    `json:"radius"`
	Rows   int    `json:"rows"`
}

type SearchResponse struct {
	Listings []EnrichedListingResponse `json:"listings"`
	Count    int                       `json:"count"`
}

type EnrichedListingResponse struct {
	Listing      marketcheck.Listing      `json:"listing"`
	Build        marketcheck.Build        `json:"build"`
	PriceHistory []marketcheck.PricePoint `json:"price_history"`
	Valuation    marketcheck.Valuation    `json:"valuation"`
}

func normalizeSearchTerm(s string) string {
	s = strings.ToLower(s)
	var result strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result.WriteRune(r)
		}
	}
	return result.String()
}

func matchesSearch(searchTerm, listingValue string) bool {
	normalizedSearch := normalizeSearchTerm(searchTerm)
	normalizedListing := normalizeSearchTerm(listingValue)

	if normalizedSearch == "" {
		return true
	}

	return strings.Contains(normalizedListing, normalizedSearch) || strings.Contains(normalizedSearch, normalizedListing)
}

func main() {
	cfg := config.Load()

	if cfg.MarketCheckKey == "" {
		log.Fatal("MARKETCHECK_API_KEY environment variable is required")
	}

	mcClient := marketcheck.NewClientWithURL(cfg.MarketCheckKey, cfg.MarketCheckURL)

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	repo, err := repository.NewPostgresRepository(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer repo.Close()
	log.Println("Connected to PostgreSQL database")

	listingRepo := repo

	buildCache := cache.NewCache(1 * time.Hour)

	rateLimiter := ratelimit.NewRateLimiter(10.0, 20)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})

	http.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
	})

	searchHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "GET" && r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SearchRequest
		if r.Method == "POST" {
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}
		} else {
			req.Make = r.URL.Query().Get("make")
			req.Model = r.URL.Query().Get("model")
			req.Zip = r.URL.Query().Get("zip")
			if radiusStr := r.URL.Query().Get("radius"); radiusStr != "" {
				if radius, err := strconv.Atoi(radiusStr); err == nil {
					req.Radius = radius
				}
			}
			if rowsStr := r.URL.Query().Get("rows"); rowsStr != "" {
				if rows, err := strconv.Atoi(rowsStr); err == nil {
					req.Rows = rows
				}
			}
		}

		if req.Make == "" {
			req.Make = cfg.Make
		}
		if req.Model == "" {
			req.Model = cfg.Model
		}
		if req.Zip == "" {
			req.Zip = strconv.Itoa(cfg.Zip)
		}
		if req.Radius == 0 {
			req.Radius = cfg.Radius
		}
		if req.Rows == 0 {
			req.Rows = 50
		}

		listings, err := mcClient.FetchActiveListingsWithFilters(r.Context(), req.Rows*2, req.Make, req.Model, req.Zip, req.Radius)
		if err != nil {
			log.Printf("Error fetching listings: %v", err)
			http.Error(w, "Failed to fetch listings", http.StatusInternalServerError)
			return
		}

		var filteredListings []marketcheck.Listing
		for _, listing := range listings {
			makeMatch := req.Make == "" || matchesSearch(req.Make, listing.Build.Make)
			modelMatch := req.Model == "" || matchesSearch(req.Model, listing.Build.Model)

			if makeMatch && modelMatch {
				filteredListings = append(filteredListings, listing)
			}
		}

		if len(filteredListings) > req.Rows {
			filteredListings = filteredListings[:req.Rows]
		}

		enriched := make([]EnrichedListingResponse, 0, len(filteredListings))
		var wg sync.WaitGroup
		type buildResult struct {
			index int
			build *marketcheck.Build
			err   error
		}
		buildResults := make([]buildResult, len(filteredListings))

		for i, listing := range filteredListings {
			if cachedBuild, found := buildCache.GetBuild(listing.VIN); found {
				buildResults[i] = buildResult{index: i, build: cachedBuild, err: nil}
				continue
			}

			wg.Add(1)
			go func(idx int, vin string, listingBuild marketcheck.Build) {
				defer wg.Done()
				build, err := mcClient.FetchBuild(r.Context(), vin)
				if err != nil {
					log.Printf("Error fetching build for VIN %s: %v", vin, err)
					if listingBuild.Make == "" {
						buildResults[idx] = buildResult{index: idx, build: nil, err: err}
						return
					}
					build = &listingBuild
				}
				if build != nil {
					buildCache.SetBuild(vin, build)
				}
				buildResults[idx] = buildResult{index: idx, build: build, err: nil}
			}(i, listing.VIN, listing.Build)
		}

		wg.Wait()

		for i, listing := range filteredListings {
			result := buildResults[i]
			if result.build == nil {
				continue
			}

			priceHistory := []marketcheck.PricePoint{
				{
					Price: listing.Price,
					Date:  time.Now(),
				},
			}

			valuation := marketcheck.Valuation{
				IsGoodValue: listing.Price < listing.MSRP && listing.MSRP > 0,
				Score:       0.0,
			}
			if listing.MSRP > 0 {
				valuation.Score = float64(listing.MSRP-listing.Price) / float64(listing.MSRP)
			}

			enriched = append(enriched, EnrichedListingResponse{
				Listing:      listing,
				Build:        *result.build,
				PriceHistory: priceHistory,
				Valuation:    valuation,
			})
		}

		for _, listing := range enriched {
			enrichedListing := &marketcheck.EnrichedListing{
				Listing:      listing.Listing,
				Build:        listing.Build,
				PriceHistory: listing.PriceHistory,
				Valuation:    listing.Valuation,
			}
			if err := listingRepo.SaveListing(r.Context(), enrichedListing); err != nil {
				log.Printf("Error saving listing to database: %v", err)
			}
		}

		response := SearchResponse{
			Listings: enriched,
			Count:    len(enriched),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	http.Handle("/api/search", rateLimiter.Limit(searchHandler))

	port := ":8080"
	log.Printf("API server starting on http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
