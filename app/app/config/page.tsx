'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import ConfigPage from '@/app/admin/config/page';

export default function ShopifyConfigPage() {
  return (
    <ShopifyAppWrapper>
      <ConfigPage />
    </ShopifyAppWrapper>
  );
}

