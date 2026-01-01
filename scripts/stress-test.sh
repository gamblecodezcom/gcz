#!/bin/bash
# Stress test script for GambleCodez API
# Tests endpoints under heavy concurrent load

API_BASE="${API_BASE_URL:-http://localhost:3000}"
CONCURRENT="${CONCURRENT_USERS:-50}"
REQUESTS="${REQUESTS_PER_USER:-200}"

echo "=== GambleCodez Stress Test ==="
echo "API Base: $API_BASE"
echo "Concurrent Users: $CONCURRENT"
echo "Requests per User: $REQUESTS"
echo ""

# Install dependencies if needed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required"
    exit 1
fi

# Run load test
node scripts/load-test.js

# Additional stress test with Apache Bench if available
if command -v ab &> /dev/null; then
    echo ""
    echo "=== Apache Bench Stress Test ==="
    ab -n 10000 -c 100 "${API_BASE}/api/profile/dashboard-stats"
fi
