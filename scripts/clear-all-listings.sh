#!/bin/bash

set -e

cd "$(dirname "$0")/.."

NAMESPACE="motor-metrics"

echo "WARNING: This will delete ALL listings and price history from the database!"
read -p "Are you absolutely sure? Type 'DELETE ALL' to confirm: " confirm

if [ "$confirm" != "DELETE ALL" ]; then
    echo "Cancelled."
    exit 0
fi

echo "Connecting to PostgreSQL pod..."

kubectl exec -it postgres-0 -n "$NAMESPACE" -- psql -U postgres -d motor_metrics <<EOF
-- Delete all price history
TRUNCATE TABLE price_history;

-- Delete all listings
TRUNCATE TABLE listings;

-- Show empty counts
SELECT 
    (SELECT COUNT(*) FROM listings) as listings_count,
    (SELECT COUNT(*) FROM price_history) as price_history_count;
EOF

echo ""
echo "Done! All listings and price history have been cleared."
echo "New listings will be saved automatically when users search for them."

