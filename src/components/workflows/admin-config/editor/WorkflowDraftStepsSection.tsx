import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deriveCanonicalSemantics } from '@/lib/workflows/admin-config/canonical-step-semantics';
import { normalizeActionAttachmentCapability, supportsActionAttachments } from '@/lib/workflows/runtime/action-capabilities';
import type { WorkflowConfigCollaboratorLookup } from '@/lib/workflows/admin-config/types';
import type { WorkflowDraftFormValues } from './types';
import { WorkflowActionApproverPicker } from './WorkflowActionApproverPicker';

const actionTypes = ['none', 'approval', 'acknowledgement', 'execution'] as const;
const DEFAULT_ACTION_LABEL = 'Ação';
const actionTypeLabels: Record<(typeof actionTypes)[number], string> = {
  none: 'Nenhuma ação',
  approval: 'Aprovação',
  acknowledgement: 'Ciência',
  execution: 'Execução',
};

export function WorkflowDraftStepsSection({
  collaborators,
  readOnly = false,
}: {
  collaborators: WorkflowConfigCollaboratorLookup[];
  readOnly?: boolean;
}) {
  const { control, register, setValue, watch } = useFormContext<WorkflowDraftFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps',
  });
  const values = watch('steps');
  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-base">Etapas</CardTitle>
          <p className="text-sm text-muted-foreground">
            O sistema deriva automaticamente a etapa inicial, intermediaria e final pela ordem visual.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>
        ) : (
          fields.map((field, index) => {
            const step = values?.[index];
            const semantics = deriveCanonicalSemantics(index, fields.length);
            const actionType = step?.action?.type || 'none';
            const selectedApprovers = step?.action?.approvers || [];
            const unresolvedApproverIds = step?.action?.unresolvedApproverIds || [];

            return (
              <div key={field.id} className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Etapa {index + 1}</p>
                      <Badge variant="outline">{semantics.roleLabel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{semantics.roleDescription}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" disabled={readOnly} onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da etapa</Label>
                    <Input disabled={readOnly} {...register(`steps.${index}.stepName`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Semantica derivada</Label>
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{semantics.kind}</span>
                      {` • ${semantics.statusKey}`}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Ação</Label>
                    <Select
                      value={actionType}
                      disabled={readOnly}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setValue(`steps.${index}.action`, undefined, { shouldDirty: true });
                          return;
                        }

                        const currentAction = step?.action;
                        const nextAction =
                          value === 'approval' || value === 'acknowledgement' || value === 'execution'
                            ? normalizeActionAttachmentCapability({
                                type: value,
                                label:
                                  currentAction?.label.trim()
                                    ? currentAction.label
                                    : DEFAULT_ACTION_LABEL,
                                approvers: currentAction?.approvers ?? [],
                                unresolvedApproverIds: currentAction?.unresolvedApproverIds ?? [],
                                commentRequired: currentAction?.commentRequired ?? false,
                                attachmentRequired: currentAction?.attachmentRequired ?? false,
                                commentPlaceholder: currentAction?.commentPlaceholder ?? '',
                                attachmentPlaceholder: currentAction?.attachmentPlaceholder ?? '',
                              })
                            : undefined;

                        setValue(
                          `steps.${index}.action`,
                          nextAction,
                          { shouldDirty: true },
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((item) => (
                          <SelectItem key={item} value={item}>
                            {actionTypeLabels[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {step?.action ? (
                  <div className="space-y-3 rounded-md bg-muted/30 p-4">
                    <div className="space-y-2">
                      <Label>Rótulo da ação</Label>
                      <Input disabled={readOnly} {...register(`steps.${index}.action.label`)} />
                    </div>

                    <WorkflowActionApproverPicker
                      collaborators={collaborators}
                      selectedApprovers={selectedApprovers}
                      unresolvedApproverIds={unresolvedApproverIds}
                      readOnly={readOnly}
                      testIdPrefix={`approver-picker-step-${index}`}
                      onChange={(approvers, unresolvedIds) => {
                        setValue(`steps.${index}.action.approvers`, approvers, { shouldDirty: true });
                        setValue(`steps.${index}.action.unresolvedApproverIds`, unresolvedIds, {
                          shouldDirty: true,
                        });
                      }}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={step.action.commentRequired === true}
                          disabled={readOnly}
                          onCheckedChange={(checked) =>
                            setValue(`steps.${index}.action.commentRequired`, checked === true, { shouldDirty: true })
                          }
                        />
                        Comentário obrigatório
                      </label>
                      {supportsActionAttachments(actionType) ? (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={step.action.attachmentRequired === true}
                            disabled={readOnly}
                            onCheckedChange={(checked) =>
                              setValue(`steps.${index}.action.attachmentRequired`, checked === true, {
                                shouldDirty: true,
                              })
                            }
                          />
                          Anexo obrigatorio
                        </label>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly}
            onClick={() =>
              append({
                stepId: '',
                stepName: '',
                statusKey: '',
                kind: 'work',
                action: undefined,
              })
            }
          >
            Adicionar etapa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
