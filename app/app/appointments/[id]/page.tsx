'use client';

import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';
import AppointmentDetailPage from '@/app/admin/appointments/[id]/page';

export default function ShopifyAppointmentDetailPage() {
  return (
    <ShopifyAppWrapper>
      <AppointmentDetailPage />
    </ShopifyAppWrapper>
  );
}

