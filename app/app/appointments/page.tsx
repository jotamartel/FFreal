'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import AppointmentsPage from '@/app/admin/appointments/page';

export default function ShopifyAppointmentsPage() {
  return (
    <ShopifyAppWrapper>
      <AppointmentsPage />
    </ShopifyAppWrapper>
  );
}

