import { WorkflowConfigAdminGuard } from '@/components/auth/WorkflowConfigAdminGuard';
import { WorkflowDraftEditorPage } from '@/components/workflows/admin-config/editor/WorkflowDraftEditorPage';

export default async function WorkflowDraftEditorRoute({
  params,
}: {
  params: Promise<{ workflowTypeId: string; version: string }>;
}) {
  const { workflowTypeId, version } = await params;

  return (
    <WorkflowConfigAdminGuard>
      <WorkflowDraftEditorPage workflowTypeId={workflowTypeId} version={Number(version)} />
    </WorkflowConfigAdminGuard>
  );
}
