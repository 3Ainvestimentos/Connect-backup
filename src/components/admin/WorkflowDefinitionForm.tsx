
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
import { PlusCircle, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApplications, WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { iconList, getIcon } from '@/lib/icons';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';

const fieldSchema = z.object({
    id: z.string().min(1, "ID do campo é obrigatório."),
    label: z.string().min(1, "Label é obrigatório."),
    type: z.enum(['text', 'textarea', 'select', 'date', 'date-range']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.string().optional(), // Comma-separated for select
});

const definitionSchema = z.object({
    name: z.string().min(1, "Nome da definição é obrigatório."),
    description: z.string().min(1, "Descrição é obrigatória."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    fields: z.array(fieldSchema),
});

type FormValues = z.infer<typeof definitionSchema>;

interface WorkflowDefinitionFormProps {
    isOpen: boolean;
    onClose: () => void;
    definition: WorkflowDefinition | null;
}

export function WorkflowDefinitionForm({ isOpen, onClose, definition }: WorkflowDefinitionFormProps) {
    const { addWorkflowDefinition, updateWorkflowDefinition } = useApplications();
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(definitionSchema),
        defaultValues: definition ? {
            ...definition,
            fields: definition.fields.map(f => ({ ...f, options: f.options?.join(',') }))
        } : {
            name: '',
            description: '',
            icon: 'FileText',
            fields: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "fields",
    });

    const onSubmit = async (data: FormValues) => {
        const payload = {
            ...data,
            fields: data.fields.map(f => ({
                ...f,
                options: f.type === 'select' ? f.options?.split(',').map(opt => opt.trim()).filter(Boolean) : [],
            }))
        };

        try {
            if (definition) {
                await updateWorkflowDefinition({ ...payload, id: definition.id });
                toast({ title: "Sucesso!", description: "Definição de workflow atualizada." });
            } else {
                await addWorkflowDefinition(payload);
                toast({ title: "Sucesso!", description: "Nova definição de workflow criada." });
            }
            onClose();
        } catch (error) {
            toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{definition ? 'Editar Definição de Workflow' : 'Nova Definição de Workflow'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div className="p-6 pt-0 space-y-4">
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
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea id="description" {...register('description')} />
                                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                            </div>

                            {/* Dynamic Fields */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-t pt-4">Campos do Formulário</h3>
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
                                                <Label htmlFor={`fields.${index}.id`}>ID do Campo (único)</Label>
                                                <Input id={`fields.${index}.id`} {...register(`fields.${index}.id`)} placeholder="Ex: nomeCompleto" />
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
                        </div>
                    </ScrollArea>
                    <DialogFooter>
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
