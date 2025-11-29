"use client";

import { useState } from "react";
import SearchFilters from "./components/SearchFilters";
import CarCard from "./components/CarCard";
import CarDetailModal from "./components/CarDetailModal";

interface Listing {
  listing: {
    id: string;
    vin: string;
    heading: string;
    price: number;
    miles: number;
    exterior_color: string;
    interior_color: string;
    carfax_1_owner: boolean;
    carfax_clean_title: boolean;
    media: {
      photo_links: string[];
      photo_links_cached: string[];
    };
    dealer: {
      name: string;
      city: string;
      state: string;
      phone?: string;
      website?: string;
    };
    vdp_url: string;
    extra: {
      options: string[];
      features: string[];
      high_value_features: string[];
      options_packages?: string[];
      seller_comments?: string;
    };
    msrp?: number;
    price_change_percent?: number;
  };
  build: {
    year: number;
    make: string;
    model: string;
    trim: string;
    version?: string;
    body_type: string;
    vehicle_type?: string;
    transmission: string;
    drivetrain: string;
    fuel_type: string;
    doors?: number;
    city_mpg: number;
    highway_mpg: number;
    powertrain_type?: string;
    std_seating?: string;
  };
  valuation: {
    is_good_value: boolean;
    score: number;
  };
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [sortOption, setSortOption] = useState("none");

  const handleSearch = async (filters: {
    make: string;
    model: string;
    zip: string;
    radius: number;
    yearMin: number;
    yearMax: number;
  }) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.make) params.append("make", filters.make);
      if (filters.model) params.append("model", filters.model);
      if (filters.zip) params.append("zip", filters.zip);
      if (filters.radius) params.append("radius", filters.radius.toString());
      params.append("rows", "50");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      const allListings = data.listings || [];

      const filteredListings = allListings.filter((listing: Listing) => {
        const year = listing.build.year;
        return year >= filters.yearMin && year <= filters.yearMax;
      });

      setListings(filteredListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
      case "miles-asc":
        return a.listing.miles - b.listing.miles;

      case "miles-desc":
        return b.listing.miles - a.listing.miles;

      case "price-asc":
        return a.listing.price - b.listing.price;

      case "price-desc":
        return b.listing.price - a.listing.price;

      case "year-asc":
        return a.build.year - b.build.year;

      case "year-desc":
        return b.build.year - a.build.year;

      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-3 tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Motor Metrics
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Find your perfect vehicle with intelligent valuation insights
          </p>
        </header>

        {/* Search Filters */}
        <div className="mb-12">
          <SearchFilters onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
            <p className="text-sm text-red-600 mt-1">
              Make sure the API server is running on http://localhost:8080
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">
                Searching for vehicles...
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Search Results
                {sortedListings.length > 0 && (
                  <span className="ml-3 text-xl font-normal text-slate-600">
                    ({sortedListings.length}{" "}
                    {sortedListings.length === 1 ? "vehicle" : "vehicles"})
                  </span>
                )}
              </h2>
            </div>

            <div className="mb-6 flex justify-end">
              <select
                className="border border-slate-300 rounded-lg px-3 py-2"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="none">Sort By</option>
                <option value="miles-asc">Miles (Low → High)</option>
                <option value="miles-desc">Miles (High → Low)</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
                <option value="year-asc">Year (Oldest → Newest)</option>
                <option value="year-desc">Year (Newest → Oldest)</option>
              </select>
            </div>

            {sortedListings.length === 0 ? (
              <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
                <p className="text-slate-700 text-xl font-medium">
                  No vehicles found
                </p>
                <p className="text-slate-500 text-base mt-2">
                  Try adjusting your search filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <CarCard
                    key={listing.listing.id || listing.listing.vin}
                    listing={listing}
                    onClick={() => setSelectedListing(listing)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedListing && (
          <CarDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
            <p className="text-slate-600 text-lg font-medium">
              Enter your search criteria above to find vehicles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
