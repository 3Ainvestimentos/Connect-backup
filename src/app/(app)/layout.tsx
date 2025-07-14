
import AppLayoutWrapper from '@/components/layout/AppLayout';
import { RequestsProvider } from '@/contexts/RequestsContext';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequestsProvider>
      <AppLayoutWrapper>{children}</AppLayoutWrapper>
    </RequestsProvider>
  );
}
