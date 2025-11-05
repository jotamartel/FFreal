import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Friends & Family Discount App',
  description: 'Shopify Friends & Family discount program with appointment booking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

