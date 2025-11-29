#!/bin/bash

set -e

cd "$(dirname "$0")/.."

MAKE="${1:-BMW}"
NAMESPACE="motor-metrics"

echo "Clearing all entries for make: $MAKE"
echo "This will delete listings and related price history."
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "Connecting to PostgreSQL pod..."

kubectl exec -it postgres-0 -n "$NAMESPACE" -- psql -U postgres -d motor_metrics <<EOF
-- Delete price history for BMW VINs
DELETE FROM price_history
WHERE vin IN (
    SELECT vin FROM listings
    WHERE build_data->>'make' ILIKE '$MAKE'
);

-- Delete BMW listings
DELETE FROM listings
WHERE build_data->>'make' ILIKE '$MAKE';

-- Show count of remaining listings
SELECT 
    build_data->>'make' as make,
    COUNT(*) as count
FROM listings
GROUP BY build_data->>'make'
ORDER BY count DESC
LIMIT 10;
EOF

echo ""
echo "Done! Cleared all $MAKE entries from the database."

