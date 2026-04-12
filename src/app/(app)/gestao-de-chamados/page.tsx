import { ManagementV2Guard } from '@/components/auth/ManagementV2Guard';
import { WorkflowManagementPage } from '@/components/workflows/management/WorkflowManagementPage';

export default function WorkflowManagementRoutePage() {
  return (
    <ManagementV2Guard>
      <WorkflowManagementPage />
    </ManagementV2Guard>
  );
}
