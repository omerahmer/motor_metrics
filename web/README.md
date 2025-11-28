# Motor Metrics Web Frontend

A beautiful, modern Next.js frontend for searching and viewing vehicle listings with valuation insights.

## Features

- 🔍 **Advanced Search Filters**: Filter by make, model, ZIP code, and radius
- 🚗 **Rich Car Listings**: View detailed information including price, mileage, specs, and more
- 💰 **Valuation Insights**: See which vehicles offer great value
- 🖼️ **Image Gallery**: High-quality vehicle images
- 🎨 **Modern UI**: Beautiful gradient design with dark mode support
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile

## Prerequisites

1. **Node.js 18+** and **pnpm** (or npm/yarn)
2. **API Server Running**: The Go API server must be running on `http://localhost:8080`

## Installation

```bash
# Install dependencies
pnpm install
# or
npm install
```

## Running the Development Server

```bash
# Start the Next.js dev server
pnpm dev
# or
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Starting the API Server

Before using the frontend, make sure the Go API server is running:

```bash
# From the project root
cd /Users/omerahmer/personal/motor_metrics
go run ./cmd/api/main.go
```

The API server will start on `http://localhost:8080`

## Usage

1. **Start the API server** (see above)
2. **Start the frontend** (see above)
3. **Open your browser** to `http://localhost:3000`
4. **Enter search criteria**:
   - Make (e.g., "Ford", "Toyota")
   - Model (e.g., "F-150", "Camry")
   - ZIP Code (e.g., "92617")
   - Radius in miles (e.g., 50)
5. **Click "Search Vehicles"** to see results
6. **Browse listings** with detailed information, images, and valuation scores

## Features Overview

### Search Filters
- Filter by vehicle make and model
- Search by location (ZIP code and radius)
- Real-time search with loading states

### Car Cards
Each car listing displays:
- **High-quality images** (with fallback for missing images)
- **Price** in formatted currency
- **Key specs**: Year, make, model, trim
- **Mileage and MPG** information
- **Transmission, drivetrain, body type, fuel type**
- **Exterior and interior colors**
- **Carfax badges** (1 Owner, Clean Title)
- **High-value features** highlighted
- **Key options** listed
- **Dealer information** and location
- **Valuation score** and "Great Value" badge
- **Direct link** to view full details

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
web/
├── app/
│   ├── components/
│   │   ├── SearchFilters.tsx    # Search form component
│   │   └── CarCard.tsx          # Individual car listing card
│   ├── page.tsx                 # Main page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## Customization

### Colors
The app uses a beautiful gradient color scheme. You can customize colors in:
- `app/globals.css` - CSS variables for theming
- Component files - Tailwind classes for specific styling

### API Endpoint
To change the API endpoint, update the fetch URL in `app/page.tsx`:

```typescript
const response = await fetch(`http://localhost:8080/api/search?${params.toString()}`);
```

## Troubleshooting

- **"Failed to fetch listings"**: Make sure the API server is running on port 8080
- **No images showing**: Some listings may not have images. The app will show a placeholder
- **CORS errors**: The API server includes CORS headers, but if you see errors, check the API server logs
