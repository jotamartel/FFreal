'use client';

import { Suspense } from 'react';
import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import AdminDashboard from '@/app/admin/page';

export const dynamic = 'force-dynamic';

function AdminDashboardContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopifyAppWrapper>
        <AdminDashboard />
      </ShopifyAppWrapper>
    </Suspense>
  );
}

export default function ShopifyAppPage() {
  return <AdminDashboardContent />;
}

