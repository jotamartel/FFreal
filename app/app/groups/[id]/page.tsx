'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import GroupDetailPage from '@/app/admin/groups/[id]/page';

export default function ShopifyGroupDetailPage() {
  return (
    <ShopifyAppWrapper>
      <GroupDetailPage />
    </ShopifyAppWrapper>
  );
}

