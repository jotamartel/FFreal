#!/bin/bash

# API Testing Script for Friends & Family App
# Usage: ./scripts/test-api.sh [base_url]
# Default: http://localhost:3000

BASE_URL=${1:-http://localhost:3000}
MERCHANT_ID="test-merchant-$(date +%s)"
CUSTOMER_ID="test-customer-$(date +%s)"
CUSTOMER_EMAIL="test-${RANDOM}@example.com"

echo "🧪 Testing Friends & Family API"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -n "Testing $description... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓${NC} (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗${NC} (HTTP $http_code)"
    echo "$body"
  fi
  echo ""
}

# Test 1: Create Group
GROUP_DATA=$(cat <<EOF
{
  "merchantId": "$MERCHANT_ID",
  "name": "Test Group $(date +%s)",
  "ownerCustomerId": "$CUSTOMER_ID",
  "ownerEmail": "$CUSTOMER_EMAIL",
  "maxMembers": 6
}
EOF
)

test_endpoint "POST" "/api/groups" "$GROUP_DATA" "Create Group"
GROUP_ID=$(echo "$body" | jq -r '.group.id' 2>/dev/null)

if [ -z "$GROUP_ID" ] || [ "$GROUP_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create group. Cannot continue tests.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Group created with ID: $GROUP_ID${NC}"
echo ""

# Test 2: Get Groups
test_endpoint "GET" "/api/groups?customerId=$CUSTOMER_ID" "" "Get Groups by Customer"

# Test 3: Get Group Details
test_endpoint "GET" "/api/groups/$GROUP_ID" "" "Get Group Details"

# Test 4: Create Invitation
INVITE_DATA=$(cat <<EOF
{
  "groupId": "$GROUP_ID",
  "email": "invitee@example.com",
  "expiresInDays": 7
}
EOF
)

test_endpoint "POST" "/api/invitations" "$INVITE_DATA" "Create Invitation"
INVITATION_TOKEN=$(echo "$body" | jq -r '.invitation.token' 2>/dev/null)

# Test 5: Get Invitation
if [ -n "$INVITATION_TOKEN" ] && [ "$INVITATION_TOKEN" != "null" ]; then
  test_endpoint "GET" "/api/invitations?token=$INVITATION_TOKEN" "" "Get Invitation by Token"
fi

# Test 6: Validate Checkout Code
CHECKOUT_DATA=$(cat <<EOF
{
  "code": "INVALID_CODE",
  "merchantId": "$MERCHANT_ID"
}
EOF
)

test_endpoint "POST" "/api/checkout/validate-code" "$CHECKOUT_DATA" "Validate Invalid Code"

# Test 7: Get Branches
test_endpoint "GET" "/api/branches" "" "Get Branches"

# Test 8: Get Availability
test_endpoint "GET" "/api/availability?branchId=test-branch&date=2024-12-15" "" "Get Availability"

echo -e "${GREEN}✅ API Testing Complete!${NC}"
echo ""
echo "Created Group ID: $GROUP_ID"
if [ -n "$INVITATION_TOKEN" ] && [ "$INVITATION_TOKEN" != "null" ]; then
  echo "Invitation Token: $INVITATION_TOKEN"
fi

