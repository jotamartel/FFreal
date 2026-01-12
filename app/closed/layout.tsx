import { PolarisProvider } from '@/components/admin/PolarisProvider';

export default function ClosedLayout({ children }: { children: React.ReactNode }) {
  return <PolarisProvider>{children}</PolarisProvider>;
}
