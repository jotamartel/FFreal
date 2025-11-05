'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import AnalyticsPage from '@/app/admin/analytics/page';

export default function ShopifyAnalyticsPage() {
  return (
    <ShopifyAppWrapper>
      <AnalyticsPage />
    </ShopifyAppWrapper>
  );
}

