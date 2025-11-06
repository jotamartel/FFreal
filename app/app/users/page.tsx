'use client';

import { Suspense } from 'react';
import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import UsersManagementPage from '@/app/admin/users/page';

export const dynamic = 'force-dynamic';

function UsersPageContent() {
  return (
    <Suspense fallback={<div>Cargando... / Loading...</div>}>
      <ShopifyAppWrapper>
        <UsersManagementPage />
      </ShopifyAppWrapper>
    </Suspense>
  );
}

export default function ShopifyUsersPage() {
  return <UsersPageContent />;
}

