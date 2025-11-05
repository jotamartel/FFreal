import { PolarisProvider } from '@/components/admin/PolarisProvider';

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PolarisProvider>{children}</PolarisProvider>;
}

