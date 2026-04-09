import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkflowConfigCollaboratorLookup } from '@/lib/workflows/admin-config/types';
import type { WorkflowDraftFormValues } from './types';
import { WorkflowActionApproverPicker } from './WorkflowActionApproverPicker';

const stepKinds = ['start', 'work', 'final'] as const;
const actionTypes = ['none', 'approval', 'acknowledgement', 'execution'] as const;

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
  const initialStepId = watch('initialStepId');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Etapas</CardTitle>
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
              kind: fields.length === 0 ? 'start' : 'work',
              action: undefined,
            })
          }
        >
          Adicionar etapa
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>
        ) : (
          fields.map((field, index) => {
            const step = values?.[index];
            const actionType = step?.action?.type || 'none';
            const selectedApprovers = step?.action?.approvers || [];
            const unresolvedApproverIds = step?.action?.unresolvedApproverIds || [];

            return (
              <div key={field.id} className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Etapa {index + 1}</p>
                    <p className="text-xs text-muted-foreground">ID tecnico gerado automaticamente no save.</p>
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
                    <Label>Status key</Label>
                    <Input disabled={readOnly} {...register(`steps.${index}.statusKey`)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kind</Label>
                    <Select
                      value={step?.kind || 'work'}
                      disabled={readOnly}
                      onValueChange={(value) =>
                        setValue(`steps.${index}.kind`, value as WorkflowDraftFormValues['steps'][number]['kind'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stepKinds.map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            {kind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Acao</Label>
                    <Select
                      value={actionType}
                      disabled={readOnly}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setValue(`steps.${index}.action`, undefined, { shouldDirty: true });
                          return;
                        }

                        setValue(
                          `steps.${index}.action`,
                          {
                            type: value as Exclude<typeof actionTypes[number], 'none'>,
                            label: 'Acao',
                            approvers: [],
                            unresolvedApproverIds: [],
                            commentRequired: false,
                            attachmentRequired: false,
                            commentPlaceholder: '',
                            attachmentPlaceholder: '',
                          },
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
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {step?.action ? (
                  <div className="space-y-3 rounded-md bg-muted/30 p-4">
                    <div className="space-y-2">
                      <Label>Rotulo da acao</Label>
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
                        Comentario obrigatorio
                      </label>
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
                    </div>
                  </div>
                ) : null}

                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={initialStepId === step?.stepId && Boolean(step?.stepId)}
                    disabled={readOnly}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValue('initialStepId', step?.stepId || '', { shouldDirty: true });
                      }
                    }}
                  />
                  Usar como etapa inicial
                </label>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
