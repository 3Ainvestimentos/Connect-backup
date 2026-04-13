import { RequesterV2Guard } from '@/components/auth/RequesterV2Guard';
import { RequestsV2Page } from '@/components/workflows/requester/RequestsV2Page';

export default function SolicitacoesPage() {
  return (
    <RequesterV2Guard>
      <RequestsV2Page />
    </RequesterV2Guard>
  );
}
