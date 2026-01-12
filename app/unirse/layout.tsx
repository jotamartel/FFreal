import { PolarisProvider } from '@/components/admin/PolarisProvider';

export default function UnirseLayout({ children }: { children: React.ReactNode }) {
  return <PolarisProvider>{children}</PolarisProvider>;
}
