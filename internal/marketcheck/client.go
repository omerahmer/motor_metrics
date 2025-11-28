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
	return &Client{
		apiKey: apiKey,
		http: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseUrl: os.Getenv("MARKETCHECK_BASE_URL"),
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

func (c *Client) FetchBuildByID(ctx context.Context, vin string) (*Build, error) {
	endpoint := fmt.Sprintf("decode/car/%s/specs", c.baseUrl, vin)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
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

	var build Build
	if err := json.NewDecoder(res.Body).Decode(&build); err != nil {
		return nil, err
	}

	return &build, nil
}

func (c *Client) FetchActiveListings(ctx context.Context, rows int) ([]Listing, error) {
	endpoint := fmt.Sprintf("%s/search/car/active", c.baseUrl)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Set("api_key", c.apiKey)
	q.Set("rows", fmt.Sprintf("%d", rows))
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
