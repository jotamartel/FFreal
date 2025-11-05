import { ShopifyAppWrapper } from '@/components/admin/ShopifyAppWrapper';

export default function CustomerLayout({
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

