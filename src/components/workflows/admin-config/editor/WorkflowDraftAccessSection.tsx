import { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RecipientSelectionModal } from '@/components/admin/RecipientSelectionModal';
import type { WorkflowConfigCollaboratorLookup } from '@/lib/workflows/admin-config/types';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import type { WorkflowDraftFormValues } from './types';

const defaultPermissions = {
  canManageWorkflows: false,
  canManageWorkflowsV2: false,
  canManageRequests: false,
  canManageContent: false,
  canManageTripsBirthdays: false,
  canViewTasks: false,
  canViewBI: false,
  canViewRankings: false,
  canViewCRM: false,
  canViewStrategicPanel: false,
  canViewOpportunityMap: false,
  canViewMeetAnalyses: false,
  canViewDirectoria: false,
  canViewBILeaders: false,
} as const;

export function WorkflowDraftAccessSection({
  collaborators,
  readOnly = false,
}: {
  collaborators: WorkflowConfigCollaboratorLookup[];
  readOnly?: boolean;
}) {
  const { control, watch, setValue } = useFormContext<WorkflowDraftFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mode = watch('access.mode');
  const selectedIds = watch('access.allowedUserIds');
  const preview = watch('access.preview');

  const modalCollaborators = useMemo<Collaborator[]>(
    () =>
      collaborators.map((collaborator, index) => ({
        id: `lookup-${collaborator.userId}-${index}`,
        id3a: collaborator.userId,
        name: collaborator.name,
        email: collaborator.email,
        axis: '',
        area: collaborator.area || '',
        position: collaborator.position || '',
        segment: '',
        leader: '',
        city: '',
        permissions: { ...defaultPermissions },
      })),
    [collaborators],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Quem pode abrir este workflow</Label>
            <Controller
              name="access.mode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(value: 'all' | 'specific') => {
                    field.onChange(value);
                    setValue('access.allowedUserIds', value === 'all' ? ['all'] : []);
                  }}
                  className="grid gap-3 md:grid-cols-2"
                  disabled={readOnly}
                >
                  <label className="flex items-center gap-2 rounded-md border p-3">
                    <RadioGroupItem value="all" id="draft-access-all" />
                    <span>Todos</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-md border p-3">
                    <RadioGroupItem value="specific" id="draft-access-specific" />
                    <span>Lista especifica</span>
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Resumo</p>
              <p className="text-sm text-muted-foreground">{preview}</p>
              {mode === 'specific' ? (
                <p className="mt-1 text-xs text-muted-foreground">{selectedIds.length} IDs selecionados</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={mode !== 'specific' || readOnly}
              onClick={() => setIsModalOpen(true)}
            >
              Selecionar colaboradores
            </Button>
          </div>
        </CardContent>
      </Card>

      <RecipientSelectionModal
        isOpen={isModalOpen && !readOnly}
        onClose={() => setIsModalOpen(false)}
        allCollaborators={modalCollaborators}
        selectedIds={mode === 'all' ? ['all'] : selectedIds}
        onConfirm={(ids) => {
          setValue('access.allowedUserIds', ids.includes('all') ? ['all'] : ids, { shouldDirty: true });
          setValue('access.mode', ids.includes('all') ? 'all' : 'specific', { shouldDirty: true });
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
