import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { WorkflowConfigCollaboratorLookup } from '@/lib/workflows/admin-config/types';
import type { WorkflowDraftFormValues } from './types';

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
  const [searchByStep, setSearchByStep] = useState<Record<number, string>>({});

  const collaboratorsByStep = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(searchByStep).map(([index, searchTerm]) => [
          index,
          collaborators.filter((collaborator) => {
            const haystack = `${collaborator.name} ${collaborator.email} ${collaborator.area || ''}`.toLowerCase();
            return haystack.includes(searchTerm.toLowerCase());
          }),
        ]),
      ),
    [collaborators, searchByStep],
  );

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
            const filteredCollaborators =
              collaboratorsByStep[index] || collaborators;

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

                    <div className="space-y-2">
                      <Label>Selecionar aprovadores</Label>
                      <Input
                        placeholder="Filtrar por nome, email ou area"
                        value={searchByStep[index] || ''}
                        disabled={readOnly}
                        onChange={(event) =>
                          setSearchByStep((current) => ({ ...current, [index]: event.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {selectedApprovers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum aprovador selecionado.</p>
                        ) : (
                          selectedApprovers.map((approver) => (
                            <Badge key={approver.collaboratorDocId} variant="secondary">
                              {approver.name}
                            </Badge>
                          ))
                        )}
                      </div>
                      {unresolvedApproverIds.length > 0 ? (
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                          Existem aprovadores historicos nao resolvidos nesta etapa. Revise a selecao antes de salvar.
                        </div>
                      ) : null}
                      <ScrollArea className="h-48 rounded-md border bg-background p-3">
                        <div className="space-y-3">
                          {filteredCollaborators.map((collaborator) => {
                            const checked = selectedApprovers.some(
                              (approver) => approver.collaboratorDocId === collaborator.collaboratorDocId,
                            );

                            return (
                              <label
                                key={collaborator.collaboratorDocId}
                                className="flex items-start gap-3 rounded-md border p-3 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={readOnly}
                                  onCheckedChange={(nextChecked) => {
                                    const currentApprovers = step.action?.approvers || [];
                                    const nextApprovers =
                                      nextChecked === true
                                        ? [
                                            ...currentApprovers,
                                            {
                                              collaboratorDocId: collaborator.collaboratorDocId,
                                              userId: collaborator.userId,
                                              name: collaborator.name,
                                              email: collaborator.email,
                                            },
                                          ]
                                        : currentApprovers.filter(
                                            (approver) =>
                                              approver.collaboratorDocId !== collaborator.collaboratorDocId,
                                          );

                                    setValue(
                                      `steps.${index}.action.approvers`,
                                      Array.from(
                                        new Map(
                                          nextApprovers.map((approver) => [approver.collaboratorDocId, approver]),
                                        ).values(),
                                      ),
                                      { shouldDirty: true },
                                    );
                                    setValue(`steps.${index}.action.unresolvedApproverIds`, [], {
                                      shouldDirty: true,
                                    });
                                  }}
                                />
                                <div className="space-y-1">
                                  <p className="font-medium">{collaborator.name}</p>
                                  <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                                  {collaborator.area ? (
                                    <p className="text-xs text-muted-foreground">{collaborator.area}</p>
                                  ) : null}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

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
