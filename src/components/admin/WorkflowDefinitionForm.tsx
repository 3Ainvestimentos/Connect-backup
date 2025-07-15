
"use client";

import React from 'react';
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
import { PlusCircle, Trash2, GripVertical, Loader2, Route, ListTodo, Timer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApplications, WorkflowDefinition, WorkflowStatusDefinition } from '@/contexts/ApplicationsContext';
import { iconList, getIcon } from '@/lib/icons';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

const statusSchema = z.object({
    id: z.string().min(1, "ID do status é obrigatório.").regex(/^[a-z0-9_]+$/, "ID deve conter apenas letras minúsculas, números e underscores."),
    label: z.string().min(1, "Label é obrigatório."),
});

const fieldSchema = z.object({
    id: z.string().min(1, "ID do campo é obrigatório.").regex(/^[a-zA-Z0-9_]+$/, "ID deve conter apenas letras, números e underscores."),
    label: z.string().min(1, "Label é obrigatório."),
    type: z.enum(['text', 'textarea', 'select', 'date', 'date-range']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.string().optional(), // Comma-separated for select
});

const routingRuleSchema = z.object({
  field: z.string().min(1, "Campo é obrigatório."),
  value: z.string().min(1, "Valor é obrigatório."),
  notify: z.string().min(1, "Emails são obrigatórios.").transform(val => val.split(',').map(s => s.trim())),
});


const definitionSchema = z.object({
    name: z.string().min(1, "Nome da definição é obrigatório."),
    description: z.string().min(1, "Descrição é obrigatória."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    slaDays: z.coerce.number().int().min(0, "SLA não pode ser negativo.").optional(),
    fields: z.array(fieldSchema),
    routingRules: z.array(routingRuleSchema),
    statuses: z.array(statusSchema).min(1, "Pelo menos um status é necessário."),
});

type FormValues = z.infer<typeof definitionSchema>;

interface WorkflowDefinitionFormProps {
    isOpen: boolean;
    onClose: () => void;
    definition: WorkflowDefinition | null;
}

export function WorkflowDefinitionForm({ isOpen, onClose, definition }: WorkflowDefinitionFormProps) {
    const { addWorkflowDefinition, updateWorkflowDefinition } = useApplications();
    const { control, register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormValues>({
        resolver: zodResolver(definitionSchema),
        defaultValues: definition ? {
            ...definition,
            fields: definition.fields.map(f => ({ ...f, options: f.options?.join(',') })),
            routingRules: definition.routingRules ? definition.routingRules.map(r => ({ ...r, notify: r.notify.join(',') })) : [],
            statuses: definition.statuses?.length ? definition.statuses : [{ id: 'pending', label: 'Pendente' }],
        } : {
            name: '',
            description: '',
            icon: 'FileText',
            slaDays: undefined,
            fields: [],
            routingRules: [],
            statuses: [{ id: 'pending', label: 'Pendente' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "fields" });
    const { fields: rules, append: appendRule, remove: removeRule } = useFieldArray({ control, name: "routingRules" });
    const { fields: statuses, append: appendStatus, remove: removeStatus } = useFieldArray({ control, name: "statuses" });

    const watchedFields = watch('fields');

    const onSubmit = async (data: FormValues) => {
        const payload = {
            ...data,
            fields: data.fields.map(f => ({
                ...f,
                options: f.type === 'select' ? f.options?.split(',').map(opt => opt.trim()).filter(Boolean) : [],
            })),
            routingRules: data.routingRules.map(r => ({
                ...r,
                notify: Array.isArray(r.notify) ? r.notify : r.notify.split(',').map(s => s.trim())
            }))
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Nome do Workflow</Label>
                                    <Input id="name" {...register('name')} />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="icon">Ícone</Label>
                                    <Controller
                                        name="icon"
                                        control={control}
                                        render={({ field }) => {
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
                            <div>
                                <Label htmlFor="slaDays">SLA (em dias úteis)</Label>
                                <Input id="slaDays" type="number" {...register('slaDays')} placeholder="Ex: 5" />
                                {errors.slaDays && <p className="text-sm text-destructive mt-1">{errors.slaDays.message}</p>}
                            </div>
                            <Separator />
                            {/* Custom Statuses */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><ListTodo className="h-5 w-5"/> Etapas do Workflow (Status)</h3>
                                {errors.statuses?.root && <p className="text-sm text-destructive mt-1">{errors.statuses.root.message}</p>}
                                <p className="text-xs text-muted-foreground">Defina as etapas do seu processo em ordem. A primeira etapa será o status inicial.</p>
                                {statuses.map((status, index) => (
                                    <div key={status.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
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
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendStatus({ id: `etapa_${statuses.length + 1}`, label: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa
                                </Button>
                            </div>

                            <Separator />
                            {/* Dynamic Fields */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Campos do Formulário</h3>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative bg-card">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`fields.${index}.label`}>Label do Campo</Label>
                                                <Input id={`fields.${index}.label`} {...register(`fields.${index}.label`)} placeholder="Ex: Nome Completo" />
                                                {errors.fields?.[index]?.label && <p className="text-sm text-destructive mt-1">{errors.fields?.[index]?.label?.message}</p>}
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
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div>
                                                <Label htmlFor={`fields.${index}.id`}>ID do Campo (único, sem espaços)</Label>
                                                <Input id={`fields.${index}.id`} {...register(`fields.${index}.id`)} placeholder="Ex: nome_completo" />
                                                {errors.fields?.[index]?.id && <p className="text-sm text-destructive mt-1">{errors.fields?.[index]?.id?.message}</p>}
                                            </div>
                                             <div>
                                                <Label htmlFor={`fields.${index}.placeholder`}>Placeholder (opcional)</Label>
                                                <Input id={`fields.${index}.placeholder`} {...register(`fields.${index}.placeholder`)} />
                                            </div>
                                        </div>
                                         <Controller name={`fields.${index}.type`} control={control} render={({ field: { value } }) => (
                                            value === 'select' ? (
                                                 <div>
                                                    <Label htmlFor={`fields.${index}.options`}>Opções (separadas por vírgula)</Label>
                                                    <Input id={`fields.${index}.options`} {...register(`fields.${index}.options`)} placeholder="Opção 1, Opção 2" />
                                                </div>
                                            ) : null
                                        )} />
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
                                <Button type="button" variant="outline" onClick={() => append({ id: `campo_${fields.length + 1}`, label: '', type: 'text', required: false, placeholder: '', options: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo
                                </Button>
                            </div>
                            <Separator />
                             {/* Routing Rules */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Route className="h-5 w-5"/> Regras de Roteamento</h3>
                                {rules.map((rule, index) => (
                                    <div key={rule.id} className="p-4 border rounded-lg space-y-3 relative bg-card">
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
                                                {errors.routingRules?.[index]?.field && <p className="text-sm text-destructive mt-1">{errors.routingRules?.[index]?.field?.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor={`routingRules.${index}.value`}>...tiver o valor</Label>
                                                <Input id={`routingRules.${index}.value`} {...register(`routingRules.${index}.value`)} placeholder="Ex: Alta" />
                                                {errors.routingRules?.[index]?.value && <p className="text-sm text-destructive mt-1">{errors.routingRules?.[index]?.value?.message}</p>}
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
                                <Button type="button" variant="outline" onClick={() => appendRule({ field: '', value: '', notify: '' as any })}>
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
            </DialogContent>
        </Dialog>
    );
}
