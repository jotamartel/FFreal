import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopifyAppWrapper>
      {children}
    </ShopifyAppWrapper>
  );
}

