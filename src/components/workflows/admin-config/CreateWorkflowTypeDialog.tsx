"use client";

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/icons';
import { iconList } from '@/lib/icon-list';
import { RecipientSelectionModal } from '@/components/admin/RecipientSelectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import { createWorkflowType } from '@/lib/workflows/admin-config/api-client';

const schema = z.object({
  areaId: z.string().min(1, 'Selecione uma area.'),
  name: z.string().min(1, 'Informe o nome do workflow.'),
  description: z.string().min(1, 'Informe uma descricao inicial.'),
  icon: z.string().min(1, 'Selecione um icone.'),
  ownerUserId: z.string().min(1, 'Selecione um owner.'),
  defaultSlaDays: z.coerce.number().min(0, 'SLA invalido.'),
  accessMode: z.enum(['all', 'specific']),
  allowedUserIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export function CreateWorkflowTypeDialog({
  open,
  onOpenChange,
  onOpenEditor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEditor?: (workflowTypeId: string, version: number) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { collaborators } = useCollaborators();
  const { workflowAreas } = useWorkflowAreas();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      areaId: '',
      name: '',
      description: '',
      icon: 'FileText',
      ownerUserId: '',
      defaultSlaDays: 0,
      accessMode: 'all',
      allowedUserIds: ['all'],
    },
  });

  const accessMode = watch('accessMode');
  const allowedUserIds = watch('allowedUserIds');

  useEffect(() => {
    if (open) {
      reset({
        areaId: workflowAreas[0]?.id || '',
        name: '',
        description: '',
        icon: 'FileText',
        ownerUserId: collaborators[0]?.id3a || '',
        defaultSlaDays: 0,
        accessMode: 'all',
        allowedUserIds: ['all'],
      });
    }
  }, [open, reset, workflowAreas, collaborators]);

  const collaboratorOptions = useMemo(
    () =>
      collaborators.map((collaborator) => ({
        ...collaborator,
        permissions: collaborator.permissions,
      })),
    [collaborators],
  );

  const accessDescription = useMemo(() => {
    if (accessMode === 'all' || allowedUserIds.includes('all')) {
      return 'Acesso publico para todos os colaboradores';
    }

    if (allowedUserIds.length === 0) {
      return 'Nenhum colaborador selecionado';
    }

    if (allowedUserIds.length === 1) {
      return 'Acesso restrito a 1 colaborador';
    }

    return `Acesso restrito a ${allowedUserIds.length} colaboradores`;
  }, [accessMode, allowedUserIds]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      return;
    }

    try {
      const result = await createWorkflowType(user, {
        areaId: values.areaId,
        name: values.name,
        description: values.description,
        icon: values.icon,
        ownerUserId: values.ownerUserId,
        allowedUserIds: values.accessMode === 'all' ? ['all'] : values.allowedUserIds,
        defaultSlaDays: values.defaultSlaDays,
      });

      toast({
        title: 'Workflow criado',
        description: 'O rascunho inicial foi aberto no editor.',
      });
      onOpenChange(false);
      if (onOpenEditor) {
        onOpenEditor(result.workflowTypeId, result.version);
      }
    } catch (error) {
      toast({
        title: 'Falha ao criar workflow',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo tipo</DialogTitle>
            <DialogDescription>Crie o workflow type e abra automaticamente o rascunho inicial v1.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Area</Label>
                <Controller
                  name="areaId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma area" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflowAreas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.areaId ? <p className="text-sm text-destructive">{errors.areaId.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>Owner</Label>
                <Controller
                  name="ownerUserId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {collaborators.map((collaborator) => (
                          <SelectItem key={collaborator.id} value={collaborator.id3a}>
                            {collaborator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ownerUserId ? <p className="text-sm text-destructive">{errors.ownerUserId.message}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-type-name">Nome</Label>
              <Input id="workflow-type-name" {...register('name')} />
              {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-type-description">Descricao</Label>
              <Textarea id="workflow-type-description" {...register('description')} rows={3} />
              {errors.description ? <p className="text-sm text-destructive">{errors.description.message}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Icone</Label>
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => {
                    const Icon = getIcon(field.value);
                    return (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{field.value}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {iconList.map((iconName) => {
                              const ItemIcon = getIcon(iconName);
                              return (
                                <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-2">
                                    <ItemIcon className="h-4 w-4" />
                                    <span>{iconName}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-type-sla">SLA padrao (dias)</Label>
                <Input id="workflow-type-sla" type="number" min={0} {...register('defaultSlaDays')} />
                {errors.defaultSlaDays ? (
                  <p className="text-sm text-destructive">{errors.defaultSlaDays.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <Label>Acesso inicial</Label>
              <Controller
                name="accessMode"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value: 'all' | 'specific') => {
                      field.onChange(value);
                      setValue('allowedUserIds', value === 'all' ? ['all'] : []);
                    }}
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <label className="flex items-center gap-2 rounded-md border p-3">
                      <RadioGroupItem value="all" id="create-access-all" />
                      <span>Todos</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-3">
                      <RadioGroupItem value="specific" id="create-access-specific" />
                      <span>Lista especifica</span>
                    </label>
                  </RadioGroup>
                )}
              />
              <div className="flex items-center justify-between gap-4 rounded-md bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">{accessDescription}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={accessMode !== 'specific'}
                  onClick={() => setIsRecipientModalOpen(true)}
                >
                  Selecionar lista
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar e abrir rascunho
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RecipientSelectionModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
        allCollaborators={collaboratorOptions}
        selectedIds={accessMode === 'all' ? ['all'] : allowedUserIds}
        onConfirm={(ids) => {
          setValue('allowedUserIds', ids);
          setValue('accessMode', ids.includes('all') ? 'all' : 'specific');
          setIsRecipientModalOpen(false);
        }}
      />
    </>
  );
}
