#!/bin/bash

# Project Structure Verification Script

echo "🔍 Checking Friends & Family App Structure"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_exists() {
  if [ -e "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 (missing)"
    return 1
  fi
}

errors=0

echo "📁 Core Files:"
check_exists "package.json" || ((errors++))
check_exists "tsconfig.json" || ((errors++))
check_exists "next.config.js" || ((errors++))
check_exists "shopify.app.toml" || ((errors++))
check_exists ".env.example" || ((errors++))
echo ""

echo "📁 Database:"
check_exists "lib/database/schema.sql" || ((errors++))
check_exists "lib/database/client.ts" || ((errors++))
check_exists "lib/database/ff-groups.ts" || ((errors++))
check_exists "lib/database/appointments.ts" || ((errors++))
check_exists "lib/database/branches.ts" || ((errors++))
check_exists "lib/database/availability.ts" || ((errors++))
echo ""

echo "📁 Admin Pages:"
check_exists "app/admin/layout.tsx" || ((errors++))
check_exists "app/admin/page.tsx" || ((errors++))
check_exists "app/admin/groups/page.tsx" || ((errors++))
check_exists "app/admin/groups/[id]/page.tsx" || ((errors++))
check_exists "app/admin/config/page.tsx" || ((errors++))
check_exists "app/admin/analytics/page.tsx" || ((errors++))
check_exists "app/admin/appointments/page.tsx" || ((errors++))
check_exists "app/admin/appointments/[id]/page.tsx" || ((errors++))
echo ""

echo "📁 Customer Pages:"
check_exists "app/customer/layout.tsx" || ((errors++))
check_exists "app/customer/page.tsx" || ((errors++))
check_exists "app/customer/groups/new/page.tsx" || ((errors++))
check_exists "app/customer/groups/[id]/page.tsx" || ((errors++))
check_exists "app/customer/appointments/page.tsx" || ((errors++))
check_exists "app/customer/appointments/new/page.tsx" || ((errors++))
check_exists "app/customer/invitations/[token]/page.tsx" || ((errors++))
echo ""

echo "📁 API Routes:"
api_count=$(find app/api -name "route.ts" | wc -l | tr -d ' ')
echo -e "${GREEN}✓${NC} Found $api_count API route files"
echo ""

echo "📁 Components:"
check_exists "components/admin/PolarisProvider.tsx" || ((errors++))
check_exists "components/admin/ShopifyAppWrapper.tsx" || ((errors++))
echo ""

echo "📁 Types:"
check_exists "types/ff-groups.ts" || ((errors++))
check_exists "types/appointments.ts" || ((errors++))
check_exists "types/availability.ts" || ((errors++))
check_exists "types/branch.ts" || ((errors++))
echo ""

echo "📁 Services:"
check_exists "lib/email/service.ts" || ((errors++))
check_exists "lib/shopify/client.ts" || ((errors++))
check_exists "lib/shopify/auth.ts" || ((errors++))
echo ""

echo "📊 Summary:"
total_files=$(find app lib components types -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Total TypeScript files: $total_files"

if [ $errors -eq 0 ]; then
  echo -e "\n${GREEN}✅ All critical files are present!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Found $errors missing files${NC}"
  exit 1
fi

