import { FacilitiesPilotPage } from '@/components/pilot/facilities/FacilitiesPilotPage';
import { resolveFacilitiesPilotWorkflowTypeId } from '@/lib/workflows/pilot/workflow-registry';

type PilotFacilitiesPageProps = {
  searchParams?: Promise<{
    workflow?: string | string[];
  }>;
};

export default async function PilotFacilitiesPage({ searchParams }: PilotFacilitiesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const workflowParam = Array.isArray(params?.workflow) ? params.workflow[0] : params?.workflow;
  const initialWorkflowTypeId = resolveFacilitiesPilotWorkflowTypeId(workflowParam);

  return <FacilitiesPilotPage initialWorkflowTypeId={initialWorkflowTypeId} />;
}
