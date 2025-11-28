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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {build.year} {build.make} {build.model}
            </h2>
            {build.trim && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{build.trim}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.slice(0, 6).map((img, idx) => (
                  <div key={idx} className="relative h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
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
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(car.price)}
              </span>
              {valuation.is_good_value ? (
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                  ✓ Great Value
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                  ⚠ Fair Value
                </span>
              )}
            </div>
            {car.msrp !== undefined && car.msrp > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                MSRP: {formatPrice(car.msrp)} • Savings: {formatPrice(car.msrp - car.price)}
              </p>
            )}
            {valuation.score !== 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Value Score: <span className="font-semibold">{(valuation.score * 100).toFixed(1)}%</span>
              </p>
            )}
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Mileage</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatMiles(car.miles)}</p>
            </div>
            {build.city_mpg > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">MPG</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {build.city_mpg}/{build.highway_mpg}
                </p>
              </div>
            )}
            {build.transmission && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Transmission</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{build.transmission}</p>
              </div>
            )}
            {build.drivetrain && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Drivetrain</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{build.drivetrain}</p>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {build.body_type && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Body Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.body_type}</p>
                </div>
              )}
              {build.fuel_type && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fuel Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.fuel_type}</p>
                </div>
              )}
              {build.doors !== undefined && build.doors > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Doors</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.doors}</p>
                </div>
              )}
              {build.std_seating && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seating</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.std_seating}</p>
                </div>
              )}
              {build.vehicle_type && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.vehicle_type}</p>
                </div>
              )}
              {build.powertrain_type && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Powertrain</p>
                  <p className="font-medium text-gray-900 dark:text-white">{build.powertrain_type}</p>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          {(car.exterior_color || car.interior_color) && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Colors</h3>
              <div className="flex gap-4">
                {car.exterior_color && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exterior</p>
                    <p className="font-medium text-gray-900 dark:text-white">{car.exterior_color}</p>
                  </div>
                )}
                {car.interior_color && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interior</p>
                    <p className="font-medium text-gray-900 dark:text-white">{car.interior_color}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carfax Information */}
          <div className="mb-6 flex gap-4">
            {car.carfax_1_owner && (
              <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg font-medium">
                ✓ 1 Owner
              </div>
            )}
            {car.carfax_clean_title && (
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg font-medium">
                ✓ Clean Title
              </div>
            )}
          </div>

          {/* High Value Features */}
          {highValueFeatures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                High Value Features
              </h3>
              <div className="flex flex-wrap gap-2">
                {highValueFeatures.map((feature, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Options */}
          {options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                All Options & Features ({options.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {options.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Features ({features.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Seller Comments</h3>
              <p className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {car.extra.seller_comments}
              </p>
            </div>
          )}

          {/* Dealer Information */}
          {car.dealer && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Dealer Information</h3>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.dealer.name}</p>
                {car.dealer.city && car.dealer.state && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {car.dealer.city}, {car.dealer.state}
                  </p>
                )}
                {car.dealer.phone && (
                  <p className="text-gray-600 dark:text-gray-400">Phone: {car.dealer.phone}</p>
                )}
                {car.dealer.website && (
                  <a
                    href={car.dealer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* VIN */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">VIN</p>
            <p className="font-mono text-gray-900 dark:text-white">{car.vin}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href={car.vdp_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
            >
              View Full Listing
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

