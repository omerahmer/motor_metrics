package marketcheck

import (
	"encoding/json"
	"time"
)

type PricePoint struct {
	Price int       `json:"price"`
	Date  time.Time `json:"date"`
}

func (p *PricePoint) UnmarshalJSON(data []byte) error {
	var tmp struct {
		Price int   `json:"price"`
		Date  int64 `json:"date"`
	}
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	p.Price = tmp.Price
	p.Date = time.Unix(tmp.Date, 0)
	return nil
}

type Valuation struct {
	IsGoodValue bool    `json:"is_good_value"`
	Score       float64 `json:"score"` // e.g., deviation from market median
}

type Listing struct {
	ID                  string  `json:"id"`
	VIN                 string  `json:"vin"`
	Heading             string  `json:"heading"`
	Price               int     `json:"price"`
	PriceChangePercent  float64 `json:"price_change_percent"`
	MSRP                int     `json:"msrp"`
	RefPrice            int     `json:"ref_price"`
	RefPriceDate        int64   `json:"ref_price_dt"`
	Miles               int     `json:"miles"`
	CarfaxOneOwner      bool    `json:"carfax_1_owner"`
	CarfaxCleanTitle    bool    `json:"carfax_clean_title"`
	ExteriorColor       string  `json:"exterior_color"`
	InteriorColor       string  `json:"interior_color"`
	BaseIntColor        string  `json:"base_int_color"`
	BaseExtColor        string  `json:"base_ext_color"`
	DOM                 int     `json:"dom"`
	DOM180              int     `json:"dom_180"`
	DOMActive           int     `json:"dom_active"`
	DOSActive           int     `json:"dos_active"`
	DataSource          string  `json:"data_source"`
	Source              string  `json:"source"`
	VDPURL              string  `json:"vdp_url"`
	SellerType          string  `json:"seller_type"`
	InventoryType       string  `json:"inventory_type"`
	StockNo             string  `json:"stock_no"`
	InTransit           bool    `json:"in_transit"`
	LastSeenAt          int64   `json:"last_seen_at"`
	LastSeenAtDate      string  `json:"last_seen_at_date"`
	ScrapedAt           int64   `json:"scraped_at"`
	ScrapedAtDate       string  `json:"scraped_at_date"`
	FirstSeenAt         int64   `json:"first_seen_at"`
	FirstSeenAtDate     string  `json:"first_seen_at_date"`
	FirstSeenAtMC       int64   `json:"first_seen_at_mc"`
	FirstSeenAtMCDate   string  `json:"first_seen_at_mc_date"`
	FirstSeenAtSource   int64   `json:"first_seen_at_source"`
	FirstSeenAtSourceDt string  `json:"first_seen_at_source_date"`

	CarLocation  CarLocation  `json:"car_location"`
	Media        Media        `json:"media"`
	Extra        Extra        `json:"extra"`
	Dealer       Dealer       `json:"dealer"`
	McDealership McDealership `json:"mc_dealership"`

	Build Build `json:"build"` // For when MarketCheck already returns build details
}

type CarLocation struct {
	SellerName string `json:"seller_name"`
	Street     string `json:"street"`
	City       string `json:"city"`
	Zip        string `json:"zip"`
	State      string `json:"state"`
	Latitude   string `json:"latitude"`
	Longitude  string `json:"longitude"`
}

type Media struct {
	PhotoLinks       []string `json:"photo_links"`
	PhotoLinksCached []string `json:"photo_links_cached"`
}

type Extra struct {
	Options         []string `json:"options"`
	Features        []string `json:"features"`
	SellerComments  string   `json:"seller_comments"`
	HighValue       []string `json:"high_value_features"`
	OptionsPackages []string `json:"options_packages"`
}

type Dealer struct {
	ID            int    `json:"id"`
	Website       string `json:"website"`
	Name          string `json:"name"`
	DealerType    string `json:"dealer_type"`
	DealershipGrp string `json:"dealership_group_name"`
	Street        string `json:"street"`
	City          string `json:"city"`
	State         string `json:"state"`
	Country       string `json:"country"`
	Zip           string `json:"zip"`
	Latitude      string `json:"latitude"`
	Longitude     string `json:"longitude"`
	MSACode       string `json:"msa_code"`
	Phone         string `json:"phone"`
	SellerEmail   string `json:"seller_email"`
}

type McDealership struct {
	MCWebsiteID         int    `json:"mc_website_id"`
	MCDealerID          int    `json:"mc_dealer_id"`
	MCLocationID        int    `json:"mc_location_id"`
	MCRooftopID         int    `json:"mc_rooftop_id"`
	MCDealershipGroupID int    `json:"mc_dealership_group_id"`
	MCDealershipGroup   string `json:"mc_dealership_group_name"`
	MCSubGroupID        int    `json:"mc_sub_dealership_group_id"`
	MCSubGroupName      string `json:"mc_sub_dealership_group_name"`
	MCCategory          string `json:"mc_category"`
	Website             string `json:"website"`
	Name                string `json:"name"`
	DealerType          string `json:"dealer_type"`
	Street              string `json:"street"`
	City                string `json:"city"`
	State               string `json:"state"`
	Country             string `json:"country"`
	Latitude            string `json:"latitude"`
	Longitude           string `json:"longitude"`
	Zip                 string `json:"zip"`
	MSACode             string `json:"msa_code"`
	Phone               string `json:"phone"`
	SellerEmail         string `json:"seller_email"`
}

type Build struct {
	Year           int    `json:"year"`
	Make           string `json:"make"`
	Model          string `json:"model"`
	Trim           string `json:"trim"`
	Version        string `json:"version"`
	BodyType       string `json:"body_type"`
	VehicleType    string `json:"vehicle_type"`
	Transmission   string `json:"transmission"`
	Drivetrain     string `json:"drivetrain"`
	FuelType       string `json:"fuel_type"`
	Doors          int    `json:"doors"`
	MadeIn         string `json:"made_in"`
	OverallHeight  string `json:"overall_height"`
	OverallLength  string `json:"overall_length"`
	OverallWidth   string `json:"overall_width"`
	StdSeating     string `json:"std_seating"`
	HighwayMPG     int    `json:"highway_mpg"`
	CityMPG        int    `json:"city_mpg"`
	PowertrainType string `json:"powertrain_type"`
}

type EnrichedListing struct {
	Listing      Listing      `json:"listing"`
	Build        Build        `json:"build"`
	PriceHistory []PricePoint `json:"price_history"`
	Valuation    Valuation    `json:"valuation"`
}
