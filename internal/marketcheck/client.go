package marketcheck

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type Client struct {
	apiKey  string
	http    *http.Client
	baseUrl string
}

func NewClient(apiKey string) *Client {
	return NewClientWithURL(apiKey, "")
}

func NewClientWithURL(apiKey, baseUrl string) *Client {
	if baseUrl == "" {
		baseUrl = os.Getenv("MARKETCHECK_BASE_URL")
		if baseUrl == "" {
			baseUrl = "https://marketcheck-prod.apigee.net/v1"
		}
	}
	return &Client{
		apiKey: apiKey,
		http: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseUrl: baseUrl,
	}
}

func (c *Client) FetchListingByID(ctx context.Context, id string) (*Listing, error) {
	listingEndpoint := fmt.Sprintf("%s/listing/car/%s", c.baseUrl, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, listingEndpoint, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Set("api_key", c.apiKey)
	req.URL.RawQuery = q.Encode()

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %s", res.Status)
	}

	var listing Listing
	if err := json.NewDecoder(res.Body).Decode(&listing); err != nil {
		return nil, err
	}

	return &listing, nil
}


func (c *Client) FetchActiveListings(ctx context.Context, rows int) ([]Listing, error) {
	return c.FetchActiveListingsWithFilters(ctx, rows, "", "", "", 0)
}

func (c *Client) FetchActiveListingsWithFilters(ctx context.Context, rows int, make, model, zip string, radius int) ([]Listing, error) {
	endpoint := fmt.Sprintf("%s/search/car/active", c.baseUrl)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Set("api_key", c.apiKey)
	q.Set("rows", fmt.Sprintf("%d", rows))
	if make != "" {
		q.Set("make", make)
	}
	if model != "" {
		q.Set("model", model)
	}
	if zip != "" {
		q.Set("zip", zip)
	}
	if radius > 0 {
		q.Set("radius", fmt.Sprintf("%d", radius))
	}
	req.URL.RawQuery = q.Encode()

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %s", res.Status)
	}

	var listings struct {
		Listings []Listing `json:"listings"`
	}
	if err := json.NewDecoder(res.Body).Decode(&listings); err != nil {
		return nil, err
	}

	return listings.Listings, nil
}

func (c *Client) FetchBuild(ctx context.Context, vin string) (*Build, error) {
	endpoint := fmt.Sprintf("%s/decode/car/%s/specs", c.baseUrl, vin)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Set("api_key", c.apiKey)
	req.URL.RawQuery = q.Encode()

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var build Build
	if err := json.NewDecoder(resp.Body).Decode(&build); err != nil {
		return nil, err
	}

	return &build, nil
}
