
import AdminGuard from '@/components/auth/AdminGuard';
import { Separator } from '@/components/ui/separator';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
        {children}
    </AdminGuard>
  );
}
