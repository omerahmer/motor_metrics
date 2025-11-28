"use client";

import Image from "next/image";

interface CarCardProps {
  listing: {
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
  };
  onClick?: () => void;
}

export default function CarCard({ listing, onClick }: CarCardProps) {
  const { listing: car, build, valuation } = listing;
  const imageUrl = car.media?.photo_links?.[0] || car.media?.photo_links_cached?.[0] || null;
  const options = car.extra?.options || [];
  const highValueFeatures = car.extra?.high_value_features || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMiles = (miles: number) => {
    return new Intl.NumberFormat("en-US").format(miles);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={car.heading || `${build.year} ${build.make} ${build.model}`}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Valuation Badge */}
        {valuation.is_good_value && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            Great Value
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {build.year} {build.make} {build.model}
          </h3>
          {build.trim && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{build.trim}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-500">{car.heading}</p>
        </div>

        {/* Price and Key Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(car.price)}
            </span>
            {valuation.is_good_value ? (
              <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                ✓ Great Value
              </span>
            ) : valuation.score !== 0 ? (
              <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                ⚠ Fair Value
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatMiles(car.miles)} miles
            </span>
            {build.city_mpg > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {build.city_mpg}/{build.highway_mpg} MPG
              </span>
            )}
          </div>
        </div>

        {/* Specs */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          {build.transmission && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="font-medium">Trans:</span>
              <span>{build.transmission}</span>
            </div>
          )}
          {build.drivetrain && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="font-medium">Drive:</span>
              <span>{build.drivetrain}</span>
            </div>
          )}
          {build.body_type && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="font-medium">Body:</span>
              <span>{build.body_type}</span>
            </div>
          )}
          {build.fuel_type && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="font-medium">Fuel:</span>
              <span>{build.fuel_type}</span>
            </div>
          )}
        </div>

        {/* Colors */}
        {(car.exterior_color || car.interior_color) && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {car.exterior_color && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                Exterior: {car.exterior_color}
              </span>
            )}
            {car.interior_color && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                Interior: {car.interior_color}
              </span>
            )}
          </div>
        )}

        {/* Carfax Badges */}
        <div className="mb-4 flex gap-2">
          {car.carfax_1_owner && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
              1 Owner
            </span>
          )}
          {car.carfax_clean_title && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
              Clean Title
            </span>
          )}
        </div>

        {/* High Value Features */}
        {highValueFeatures.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              High Value Features:
            </p>
            <div className="flex flex-wrap gap-2">
              {highValueFeatures.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Options Preview */}
        {options.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Key Options:
            </p>
            <div className="flex flex-wrap gap-2">
              {options.slice(0, 5).map((option, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  {option}
                </span>
              ))}
              {options.length > 5 && (
                <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                  +{options.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dealer Info */}
        {car.dealer && (
          <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{car.dealer.name}</span>
              {car.dealer.city && car.dealer.state && (
                <span className="ml-2">
                  • {car.dealer.city}, {car.dealer.state}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Valuation Score */}
        {valuation.score !== 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Value Score:</span>
              <span className={`font-semibold ${valuation.is_good_value ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                {(valuation.score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

