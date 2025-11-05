'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import GroupsPage from '@/app/admin/groups/page';

export default function ShopifyGroupsPage() {
  return (
    <ShopifyAppWrapper>
      <GroupsPage />
    </ShopifyAppWrapper>
  );
}

