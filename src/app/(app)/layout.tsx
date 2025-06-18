
import AppLayoutWrapper from '@/components/layout/AppLayout';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
}
