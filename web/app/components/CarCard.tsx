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
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 cursor-pointer group"
    >
      {/* Image Section */}
      <div className="relative h-64 w-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={car.heading || `${build.year} ${build.make} ${build.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center justify-center h-full text-slate-400">
                    <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Valuation Badge */}
        {valuation.is_good_value && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            ✓ Great Value
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-1">
            {build.year} {build.make} {build.model}
          </h3>
          {build.trim && (
            <p className="text-sm text-slate-600 font-medium">{build.trim}</p>
          )}
        </div>

        {/* Price and Key Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-blue-600">
              {formatPrice(car.price)}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
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
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600 font-medium">Trans:</span>
              <span className="text-slate-900 ml-2 font-medium">{build.transmission}</span>
            </div>
          )}
          {build.drivetrain && (
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600 font-medium">Drive:</span>
              <span className="text-slate-900 ml-2 font-medium">{build.drivetrain}</span>
            </div>
          )}
        </div>

        {/* Carfax Badges */}
        <div className="mb-4 flex gap-2">
          {car.carfax_1_owner && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
              1 Owner
            </span>
          )}
          {car.carfax_clean_title && (
            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200">
              Clean Title
            </span>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

