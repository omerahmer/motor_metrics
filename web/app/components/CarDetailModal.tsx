"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface CarDetailModalProps {
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
  };
  onClose: () => void;
}

export default function CarDetailModal({ listing, onClose }: CarDetailModalProps) {
  const { listing: car, build, valuation } = listing;
  const images = car.media?.photo_links || car.media?.photo_links_cached || [];
  const options = car.extra?.options || [];
  const features = car.extra?.features || [];
  const highValueFeatures = car.extra?.high_value_features || [];
  const optionsPackages = car.extra?.options_packages || [];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start z-10 rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">
              {build.year} {build.make} {build.model}
            </h2>
            {build.trim && (
              <p className="text-lg text-slate-600 font-medium mt-1">{build.trim}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.slice(0, 6).map((img, idx) => (
                  <div key={idx} className="relative h-48 rounded-lg overflow-hidden bg-slate-100 shadow-md">
                    <Image
                      src={img}
                      alt={`${build.year} ${build.make} ${build.model} - Image ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price and Valuation */}
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-4xl font-bold text-blue-600">
                {formatPrice(car.price)}
              </span>
              {valuation.is_good_value ? (
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                  ✓ Great Value
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-500 text-white rounded-full text-sm font-semibold">
                  Fair Value
                </span>
              )}
            </div>
            {car.msrp !== undefined && car.msrp > 0 && (
              <p className="text-slate-600 font-medium mt-2">
                MSRP: {formatPrice(car.msrp)} • Savings: {formatPrice(car.msrp - car.price)}
              </p>
            )}
            {valuation.score !== 0 && (
              <p className="text-sm text-slate-600 font-medium mt-2">
                Value Score: <span className="font-semibold">{(valuation.score * 100).toFixed(1)}%</span>
              </p>
            )}
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 font-medium mb-1">Mileage</p>
              <p className="text-lg font-semibold text-slate-900">{formatMiles(car.miles)}</p>
            </div>
            {build.city_mpg > 0 && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">MPG</p>
                <p className="text-lg font-semibold text-slate-900">
                  {build.city_mpg}/{build.highway_mpg}
                </p>
              </div>
            )}
            {build.transmission && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">Transmission</p>
                <p className="text-lg font-semibold text-slate-900">{build.transmission}</p>
              </div>
            )}
            {build.drivetrain && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">Drivetrain</p>
                <p className="text-lg font-semibold text-slate-900">{build.drivetrain}</p>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {build.body_type && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Body Type</p>
                  <p className="font-semibold text-slate-900">{build.body_type}</p>
                </div>
              )}
              {build.fuel_type && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Fuel Type</p>
                  <p className="font-semibold text-slate-900">{build.fuel_type}</p>
                </div>
              )}
              {build.doors !== undefined && build.doors > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Doors</p>
                  <p className="font-semibold text-slate-900">{build.doors}</p>
                </div>
              )}
              {build.std_seating && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Seating</p>
                  <p className="font-semibold text-slate-900">{build.std_seating}</p>
                </div>
              )}
              {build.vehicle_type && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Vehicle Type</p>
                  <p className="font-semibold text-slate-900">{build.vehicle_type}</p>
                </div>
              )}
              {build.powertrain_type && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Powertrain</p>
                  <p className="font-semibold text-slate-900">{build.powertrain_type}</p>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          {(car.exterior_color || car.interior_color) && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Colors</h3>
              <div className="flex gap-4">
                {car.exterior_color && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex-1">
                    <p className="text-sm text-slate-600 font-medium mb-1">Exterior</p>
                    <p className="font-semibold text-slate-900 text-lg">{car.exterior_color}</p>
                  </div>
                )}
                {car.interior_color && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex-1">
                    <p className="text-sm text-slate-600 font-medium mb-1">Interior</p>
                    <p className="font-semibold text-slate-900 text-lg">{car.interior_color}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carfax Information */}
          <div className="mb-6 flex gap-3">
            {car.carfax_1_owner && (
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
                ✓ 1 Owner
              </div>
            )}
            {car.carfax_clean_title && (
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium border border-green-200">
                ✓ Clean Title
              </div>
            )}
          </div>

          {/* Options Packages */}
          {optionsPackages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Options & Packages <span className="text-slate-500 font-normal">({optionsPackages.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {optionsPackages.map((pkg, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium text-sm"
                  >
                    {pkg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Value Features */}
          {highValueFeatures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                High Value Features <span className="text-slate-500 font-normal">({highValueFeatures.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {highValueFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-900 font-medium text-sm"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Options */}
          {options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Options <span className="text-slate-500 font-normal">({options.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {options.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium text-sm"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Features <span className="text-slate-500 font-normal">({features.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium text-sm"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Comments */}
          {car.extra?.seller_comments && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Seller Comments</h3>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900 font-medium">
                {car.extra.seller_comments}
              </p>
              </div>
            </div>
          )}

          {/* Dealer Information */}
          {car.dealer && (
            <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Dealer Information</h3>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{car.dealer.name}</p>
                {car.dealer.city && car.dealer.state && (
                  <p className="text-slate-600 font-medium">
                    {car.dealer.city}, {car.dealer.state}
                  </p>
                )}
                {car.dealer.phone && (
                  <p className="text-slate-600 font-medium">Phone: {car.dealer.phone}</p>
                )}
                {car.dealer.website && (
                  <a
                    href={car.dealer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* VIN */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium mb-2">VIN</p>
            <p className="font-mono text-lg font-semibold text-slate-900">{car.vin}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href={car.vdp_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              View Full Listing
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

