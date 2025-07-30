
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, GripVertical, Loader2, Route, ListTodo, Timer, User, ShieldCheck, Users, FolderOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApplications, WorkflowDefinition, workflowDefinitionSchema } from '@/contexts/ApplicationsContext';
import { iconList, getIcon } from '@/lib/icons';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';

type FormValues = z.infer<typeof workflowDefinitionSchema>;

interface WorkflowDefinitionFormProps {
    isOpen: boolean;
    onClose: () => void;
    definition: WorkflowDefinition | null;
}

export function WorkflowDefinitionForm({ isOpen, onClose, definition }: WorkflowDefinitionFormProps) {
    const { addWorkflowDefinition, updateWorkflowDefinition } = useApplications();
    const { collaborators } = useCollaborators();
    const { workflowAreas } = useWorkflowAreas();
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isApproverSelectionModalOpen, setIsApproverSelectionModalOpen] = useState(false);
    const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);

    const { control, register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormValues>({
        resolver: zodResolver(workflowDefinitionSchema),
        defaultValues: definition ? {
            ...definition,
            fields: definition.fields.map(f => ({ ...f, options: f.options?.join(',') as any })),
            routingRules: definition.routingRules ? definition.routingRules.map(r => ({ ...r, notify: r.notify.join(', ') })) : [],
            statuses: definition.statuses?.length ? definition.statuses.map(s => ({...s, action: s.action || undefined })) : [{ id: 'pending', label: 'Pendente', action: undefined }],
            slaRules: definition.slaRules || [],
            allowedUserIds: definition.allowedUserIds || ['all'],
        } : {
            name: '',
            description: '',
            icon: 'FileText',
            areaId: '',
            ownerEmail: '',
            defaultSlaDays: undefined,
            slaRules: [],
            fields: [],
            routingRules: [],
            statuses: [{ id: 'pending', label: 'Pendente', action: undefined }],
            allowedUserIds: ['all'],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "fields" });
    const { fields: rules, append: appendRule, remove: removeRule } = useFieldArray({ control, name: "routingRules" });
    const { fields: statuses, append: appendStatus, remove: removeStatus } = useFieldArray({ control, name: "statuses" });
    const { fields: slaRules, append: appendSlaRule, remove: removeSlaRule } = useFieldArray({ control, name: "slaRules" });


    const watchedFields = watch('fields');
    const watchAllowedUserIds = watch('allowedUserIds');
    const watchedStatuses = watch('statuses');

    const uniqueCollaborators = React.useMemo(() => {
        const seen = new Set();
        return collaborators
            .filter(el => {
                const duplicate = seen.has(el.email);
                seen.add(el.email);
                return !duplicate;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [collaborators]);

    const onSubmit = async (data: FormValues) => {
        const payload = {
            ...data,
            fields: data.fields.map(f => ({
                ...f,
                options: f.type === 'select' ? (f.options as unknown as string)?.split(',').map(opt => opt.trim()).filter(Boolean) : [],
            })),
        };

        try {
            if (definition) {
                await updateWorkflowDefinition({ ...payload, id: definition.id });
                toast({ title: "Sucesso!", description: "Definição de workflow atualizada." });
            } else {
                await addWorkflowDefinition(payload as Omit<WorkflowDefinition, 'id'>);
                toast({ title: "Sucesso!", description: "Nova definição de workflow criada." });
            }
            onClose();
        } catch (error) {
            toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
        }
    };
    
    const getAccessDescription = (ids: string[] | undefined) => {
        if (!ids || ids.length === 0) return 'Nenhum destinatário selecionado';
        if (ids.includes('all')) return 'Acesso público para todos os colaboradores';
        if (ids.length === 1) return `Acesso restrito a 1 colaborador`;
        return `Acesso restrito a ${ids.length} colaboradores`;
    };

    const getApproverDescription = (ids: string[] | undefined) => {
        if (!ids || ids.length === 0) return 'Selecionar aprovadores...';
        return `${ids.length} aprovador(es) pré-definido(s)`;
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl flex flex-col h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{definition ? 'Editar Definição de Workflow' : 'Nova Definição de Workflow'}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col min-h-0">
                    <ScrollArea className="flex-grow pr-6 -mr-6">
                        <div className="space-y-6 pb-6">
                            {/* Basic Info */}
                             <div className="space-y-4 p-4 border rounded-md bg-card">
                                <h3 className="font-semibold text-lg">Informações Básicas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Nome do Workflow</Label>
                                        <Input id="name" {...register('name')} />
                                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="icon">Ícone</Label>
                                        <Controller name="icon" control={control} render={({ field }) => {
                                                const IconToShow = getIcon(field.value);
                                                return (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger><SelectValue>
                                                            <div className="flex items-center gap-2"><IconToShow className='h-4 w-4' /><span>{field.value}</span></div>
                                                        </SelectValue></SelectTrigger>
                                                        <SelectContent><ScrollArea className="h-72">
                                                            {iconList.map(iconName => {
                                                                const Icon = getIcon(iconName);
                                                                return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{iconName}</span></div></SelectItem>
                                                            })}
                                                        </ScrollArea></SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />
                                        {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
                                    </div>
                                </div>
                                 <div>
                                    <Label htmlFor="description">Descrição (Exibida ao usuário)</Label>
                                    <Textarea id="description" {...register('description')} />
                                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="areaId">Área do Workflow (Agrupamento)</Label>
                                        <Controller name="areaId" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Selecione uma área..." /></SelectTrigger>
                                                <SelectContent>
                                                    {workflowAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        {errors.areaId && <p className="text-sm text-destructive mt-1">{errors.areaId.message}</p>}
                                     </div>
                                     <div>
                                        <Label htmlFor="ownerEmail">Proprietário do Workflow (Notificações)</Label>
                                        <Controller name="ownerEmail" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Selecione um proprietário..." /></SelectTrigger>
                                                <SelectContent>
                                                    {uniqueCollaborators.map(c => <SelectItem key={c.email} value={c.email}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        {errors.ownerEmail && <p className="text-sm text-destructive mt-1">{errors.ownerEmail.message}</p>}
                                     </div>
                                 </div>
                            </div>
                            
                             {/* Access Control */}
                            <div className="space-y-4 p-4 border rounded-md bg-card">
                                 <h3 className="font-semibold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Controle de Acesso</h3>
                                 <div>
                                    <Label>Quem pode visualizar e iniciar este workflow?</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-left mt-2" onClick={() => setIsSelectionModalOpen(true)}>
                                       <Users className="mr-2 h-4 w-4" />
                                       <span className="truncate">{getAccessDescription(watchAllowedUserIds)}</span>
                                    </Button>
                                    {errors.allowedUserIds && <p className="text-sm text-destructive mt-1">{errors.allowedUserIds.message as string}</p>}
                                </div>
                            </div>
                           
                            {/* SLA Rules */}
                            <div className="space-y-4 p-4 border rounded-md bg-card">
                                 <h3 className="font-semibold text-lg flex items-center gap-2"><Timer className="h-5 w-5"/> Service Level Agreement (SLA)</h3>
                                 <div>
                                    <Label htmlFor="defaultSlaDays">SLA Padrão (em dias úteis)</Label>
                                    <Input id="defaultSlaDays" type="number" {...register('defaultSlaDays', { valueAsNumber: true })} placeholder="Ex: 5" />
                                    <p className="text-xs text-muted-foreground mt-1">Este SLA será usado se nenhuma regra condicional abaixo for atendida.</p>
                                    {errors.defaultSlaDays && <p className="text-sm text-destructive mt-1">{errors.defaultSlaDays.message}</p>}
                                </div>
                                <Separator />
                                <Label>Regras de SLA Condicionais (Opcional)</Label>
                                {slaRules.map((rule, index) => (
                                     <div key={rule.id} className="p-3 border rounded-lg space-y-3 relative bg-background">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor={`slaRules.${index}.field`}>Se o campo...</Label>
                                                <Controller name={`slaRules.${index}.field`} control={control} render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Campo..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {watchedFields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                                {errors.slaRules?.[index]?.field && <p className="text-sm text-destructive mt-1">{errors.slaRules[index]?.field?.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor={`slaRules.${index}.value`}>...for igual a</Label>
                                                <Input id={`slaRules.${index}.value`} {...register(`slaRules.${index}.value`)} placeholder="Valor..." />
                                                {errors.slaRules?.[index]?.value && <p className="text-sm text-destructive mt-1">{errors.slaRules[index]?.value?.message}</p>}
                                            </div>
                                             <div>
                                                <Label htmlFor={`slaRules.${index}.days`}>...o SLA é (dias)</Label>
                                                <Input id={`slaRules.${index}.days`} type="number" {...register(`slaRules.${index}.days`, { valueAsNumber: true })} placeholder="Dias..." />
                                                {errors.slaRules?.[index]?.days && <p className="text-sm text-destructive mt-1">{errors.slaRules[index]?.days?.message}</p>}
                                            </div>
                                        </div>
                                         <div className="flex justify-end">
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeSlaRule(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                 <Button type="button" variant="outline" onClick={() => appendSlaRule({ field: '', value: '', days: 0 })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Regra de SLA
                                </Button>
                            </div>

                            {/* Custom Statuses */}
                            <div className="space-y-4 p-4 border rounded-md bg-card">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><ListTodo className="h-5 w-5"/> Etapas do Workflow (Status)</h3>
                                {errors.statuses?.root && <p className="text-sm text-destructive mt-1">{errors.statuses.root.message}</p>}
                                <p className="text-xs text-muted-foreground">Defina as etapas do seu processo em ordem. A primeira etapa será o status inicial.</p>
                                {statuses.map((status, index) => (
                                    <div key={status.id} className="p-3 border rounded-lg bg-background space-y-3">
                                        <div className="flex items-start gap-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 flex-grow">
                                                <div>
                                                    <Label htmlFor={`statuses.${index}.label`}>Nome da Etapa (Ex: Em Análise)</Label>
                                                    <Input id={`statuses.${index}.label`} {...register(`statuses.${index}.label`)} />
                                                    {errors.statuses?.[index]?.label && <p className="text-sm text-destructive mt-1">{errors.statuses[index]?.label?.message}</p>}
                                                </div>
                                                <div>
                                                    <Label htmlFor={`statuses.${index}.id`}>ID (Ex: em_analise)</Label>
                                                    <Input id={`statuses.${index}.id`} {...register(`statuses.${index}.id`)} />
                                                    {errors.statuses?.[index]?.id && <p className="text-sm text-destructive mt-1">{errors.statuses[index]?.id?.message}</p>}
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeStatus(index)} className="mt-auto shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                        <Separator/>
                                        <div className='flex items-center gap-2'>
                                            <Controller
                                                name={`statuses.${index}.action`}
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={!!field.value}
                                                        onCheckedChange={(checked) => field.onChange(checked ? { type: 'approval', label: '' } : undefined)}
                                                        id={`action-switch-${index}`}
                                                    />
                                                )}
                                            />
                                            <Label htmlFor={`action-switch-${index}`}>Requer Ação?</Label>
                                        </div>
                                        {watchedStatuses[index]?.action && (
                                            <div className="space-y-4 pl-8 pt-2">
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor={`statuses.${index}.action.type`}>Tipo de Ação</Label>
                                                        <Controller
                                                            name={`statuses.${index}.action.type`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="approval">Aprovação (Aprovar/Reprovar)</SelectItem>
                                                                        <SelectItem value="acknowledgement">Ciência (Marcar como Ciente)</SelectItem>
                                                                        <SelectItem value="execution">Execução (Comentário/Anexo)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`statuses.${index}.action.label`}>Texto do Botão de Solicitação</Label>
                                                        <Input {...register(`statuses.${index}.action.label`)} placeholder="Ex: Solicitar Aprovação"/>
                                                        {errors.statuses?.[index]?.action?.label && <p className="text-sm text-destructive mt-1">{errors.statuses?.[index]?.action?.label?.message}</p>}
                                                    </div>
                                                </div>

                                                {watchedStatuses[index]?.action?.type === 'execution' && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                                         <div className="flex items-center gap-2">
                                                            <Controller name={`statuses.${index}.action.commentRequired`} control={control} render={({ field }) => (<Switch id={`statuses.${index}.action.commentRequired`} checked={field.value} onCheckedChange={field.onChange} />)} />
                                                            <Label htmlFor={`statuses.${index}.action.commentRequired`}>Comentário obrigatório?</Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Controller name={`statuses.${index}.action.attachmentRequired`} control={control} render={({ field }) => (<Switch id={`statuses.${index}.action.attachmentRequired`} checked={field.value} onCheckedChange={field.onChange} />)} />
                                                            <Label htmlFor={`statuses.${index}.action.attachmentRequired`}>Anexo obrigatório?</Label>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="sm:col-span-2">
                                                    <Label>Aprovadores Pré-definidos (Opcional)</Label>
                                                    <Button type="button" variant="outline" className="w-full justify-start text-left mt-2" onClick={() => { setActiveStatusIndex(index); setIsApproverSelectionModalOpen(true); }}>
                                                       <Users className="mr-2 h-4 w-4" />
                                                       <span className="truncate">{getApproverDescription(watchedStatuses[index]?.action?.approverIds)}</span>
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground mt-1">Se definido, a solicitação de ação será enviada automaticamente para estes usuários quando a tarefa entrar nesta etapa.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendStatus({ id: `etapa_${statuses.length + 1}`, label: '', action: undefined })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa
                                </Button>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="space-y-4 p-4 border rounded-md bg-card">
                                <h3 className="font-semibold text-lg">Campos do Formulário</h3>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative bg-background">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`fields.${index}.label`}>Label do Campo</Label>
                                                <Input id={`fields.${index}.label`} {...register(`fields.${index}.label`)} placeholder="Ex: Nome Completo" />
                                                {errors.fields?.[index]?.label && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.label?.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor={`fields.${index}.type`}>Tipo de Campo</Label>
                                                <Controller name={`fields.${index}.type`} control={control} render={({ field: controllerField }) => (
                                                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Texto Curto</SelectItem>
                                                            <SelectItem value="textarea">Texto Longo</SelectItem>
                                                            <SelectItem value="select">Seleção</SelectItem>
                                                            <SelectItem value="date">Data</SelectItem>
                                                            <SelectItem value="date-range">Período (Data)</SelectItem>
                                                            <SelectItem value="file">Anexo de Arquivo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div>
                                                <Label htmlFor={`fields.${index}.id`}>ID do Campo (único, sem espaços)</Label>
                                                <Input id={`fields.${index}.id`} {...register(`fields.${index}.id`)} placeholder="Ex: nome_completo" />
                                                {errors.fields?.[index]?.id && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.id?.message}</p>}
                                            </div>
                                             <div>
                                                <Label htmlFor={`fields.${index}.placeholder`}>Placeholder (opcional)</Label>
                                                <Input id={`fields.${index}.placeholder`} {...register(`fields.${index}.placeholder`)} />
                                            </div>
                                        </div>
                                         <Controller name={`fields.${index}.type`} control={control} render={({ field: { value } }) => {
                                            if (value === 'select') {
                                                return (
                                                    <div>
                                                        <Label htmlFor={`fields.${index}.options`}>Opções (separadas por vírgula)</Label>
                                                        <Input id={`fields.${index}.options`} {...register(`fields.${index}.options`)} placeholder="Opção 1, Opção 2" />
                                                        {errors.fields?.[index]?.options && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.options?.message as string}</p>}
                                                    </div>
                                                )
                                            }
                                            if (value === 'file') {
                                                return (
                                                    <p className="text-xs text-muted-foreground bg-blue-500/10 p-2 rounded-md">
                                                        O usuário poderá anexar um único arquivo. Tipos de arquivo permitidos e limites de tamanho são gerenciados pelo sistema.
                                                    </p>
                                                )
                                            }
                                            return null;
                                        }} />
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex items-center gap-2">
                                                <Controller name={`fields.${index}.required`} control={control} render={({ field: controllerField }) => (
                                                    <Switch id={`fields.${index}.required`} checked={controllerField.value} onCheckedChange={controllerField.onChange} />
                                                )} />
                                                <Label htmlFor={`fields.${index}.required`}>Obrigatório</Label>
                                            </div>
                                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => append({ id: `campo_${fields.length + 1}`, label: '', type: 'text', required: false, placeholder: '', options: '' as any })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo
                                </Button>
                            </div>
                            
                             {/* Routing Rules */}
                            <div className="space-y-4 p-4 border rounded-md bg-card">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Route className="h-5 w-5"/> Regras de Roteamento de Notificação</h3>
                                {rules.map((rule, index) => (
                                    <div key={rule.id} className="p-4 border rounded-lg space-y-3 relative bg-background">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`routingRules.${index}.field`}>Se o campo...</Label>
                                                <Controller name={`routingRules.${index}.field`} control={control} render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Selecione um campo..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {watchedFields.map(f => <SelectItem key={f.id} value={f.id}>{f.label} ({f.id})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                                {errors.routingRules?.[index]?.field && <p className="text-sm text-destructive mt-1">{errors.routingRules[index]?.field?.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor={`routingRules.${index}.value`}>...tiver o valor</Label>
                                                <Input id={`routingRules.${index}.value`} {...register(`routingRules.${index}.value`)} placeholder="Ex: Alta" />
                                                {errors.routingRules?.[index]?.value && <p className="text-sm text-destructive mt-1">{errors.routingRules[index]?.value?.message}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`routingRules.${index}.notify`}>...notificar os e-mails (separados por vírgula)</Label>
                                            <Input id={`routingRules.${index}.notify`} {...register(`routingRules.${index}.notify`)} placeholder="email1@3a.com, email2@3a.com" />
                                             {errors.routingRules?.[index]?.notify && <p className="text-sm text-destructive mt-1">{errors.routingRules?.[index]?.notify?.message as string}</p>}
                                        </div>
                                         <div className="flex justify-end pt-2">
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeRule(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendRule({ field: '', value: '', notify: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Regra
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Definição
                        </Button>
                    </DialogFooter>
                </form>

                <RecipientSelectionModal
                    isOpen={isSelectionModalOpen}
                    onClose={() => setIsSelectionModalOpen(false)}
                    allCollaborators={collaborators}
                    selectedIds={watchAllowedUserIds || []}
                    onConfirm={(newIds) => {
                        setValue('allowedUserIds', newIds, { shouldValidate: true });
                        setIsSelectionModalOpen(false);
                    }}
                />

                <RecipientSelectionModal
                    isOpen={isApproverSelectionModalOpen}
                    onClose={() => setIsApproverSelectionModalOpen(false)}
                    allCollaborators={collaborators}
                    selectedIds={activeStatusIndex !== null ? watchedStatuses[activeStatusIndex]?.action?.approverIds || [] : []}
                    onConfirm={(newIds) => {
                        if (activeStatusIndex !== null) {
                            setValue(`statuses.${activeStatusIndex}.action.approverIds`, newIds, { shouldValidate: true });
                        }
                        setIsApproverSelectionModalOpen(false);
                        setActiveStatusIndex(null);
                    }}
                />


            </DialogContent>
        </Dialog>
    );
}
