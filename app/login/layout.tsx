import { PolarisProvider } from '@/components/admin/PolarisProvider';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PolarisProvider>{children}</PolarisProvider>;
}

