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

  const handleSearch = async (filters: {
    make: string;
    model: string;
    zip: string;
    radius: number;
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      setListings(data.listings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
            Motor Metrics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find your perfect vehicle with intelligent valuation insights
          </p>
        </header>

        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Make sure the API server is running on http://localhost:8080
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search Results
                {listings.length > 0 && (
                  <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
                    ({listings.length} {listings.length === 1 ? "vehicle" : "vehicles"})
                  </span>
                )}
              </h2>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  No vehicles found. Try adjusting your search filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Enter your search criteria above to find vehicles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
