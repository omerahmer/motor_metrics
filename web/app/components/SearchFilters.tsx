"use client";

import { useState, useEffect, startTransition } from "react";
import makesData from "../../makes.json";

interface SearchFiltersProps {
  onSearch: (filters: {
    make: string;
    model: string;
    zip: string;
    radius: number;
    yearMin: number;
    yearMax: number;
  }) => void;
  loading: boolean;
}

export default function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(50);
  const [yearMin, setYearMin] = useState(2015);
  const [yearMax, setYearMax] = useState(2025);
  const currentYear = new Date().getFullYear();
  const makes = makesData as string[];

  useEffect(() => {
    if (!make) {
      startTransition(() => {
        setModels([]);
        setModel("");
      });
      return;
    }

    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    startTransition(() => {
      setLoadingModels(true);
      setModel("");
    });

    fetch(`${apiUrl}/api/models?make=${encodeURIComponent(make)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          startTransition(() => {
            setModels(data.models || []);
            setLoadingModels(false);
          });
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Error fetching models:", err);
          startTransition(() => {
            setModels([]);
            setLoadingModels(false);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [make]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zip.trim()) {
      return;
    }
    onSearch({ make, model, zip, radius, yearMin, yearMax });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50">
      <h2 className="text-3xl font-semibold text-slate-900 mb-6 tracking-tight">
        Search Vehicles
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Make
            </label>
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            >
              <option value="">Select a make</option>
              {makes.map((makeOption) => (
                <option key={makeOption} value={makeOption}>
                  {makeOption}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make || loadingModels}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingModels ? "Loading models..." : !make ? "Select a make first" : "Select a model"}
              </option>
              {models.map((modelOption) => (
                <option key={modelOption} value={modelOption}>
                  {modelOption}
                </option>
              ))}
            </select>
          </div>
        </div>
        
          <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ZIP Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            placeholder="92617"
            required
            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            />
          </div>

          <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Search Radius: <span className="font-semibold text-blue-600">{radius} miles</span>
            </label>
            <input
            type="range"
              value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
              min="1"
              max="500"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 mi</span>
            <span>500 mi</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Year Range: <span className="font-semibold text-blue-600">{yearMin} - {yearMax}</span> <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Minimum Year: {yearMin}</label>
              <input
                type="range"
                value={yearMin}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= yearMax) {
                    setYearMin(newMin);
                  }
                }}
                min="1990"
                max={yearMax}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Maximum Year: {yearMax}</label>
              <input
                type="range"
                value={yearMax}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= yearMin) {
                    setYearMax(newMax);
                  }
                }}
                min={yearMin}
                max={currentYear + 1}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !zip.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            "Search Vehicles"
          )}
        </button>
      </form>
    </div>
  );
}

