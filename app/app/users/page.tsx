'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import UsersManagementPage from '@/app/admin/users/page';

export const dynamic = 'force-dynamic';

export default function ShopifyUsersPage() {
  return (
    <ShopifyAppWrapper>
      <UsersManagementPage />
    </ShopifyAppWrapper>
  );
}

