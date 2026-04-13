import { WorkflowConfigAdminGuard } from '@/components/auth/WorkflowConfigAdminGuard';
import { WorkflowConfigPage } from '@/components/workflows/admin-config/WorkflowConfigPage';

export default function RequestConfigPage() {
  return (
    <WorkflowConfigAdminGuard>
      <WorkflowConfigPage />
    </WorkflowConfigAdminGuard>
  );
}
