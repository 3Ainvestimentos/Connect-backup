"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Collaborator } from '@/contexts/CollaboratorsContext';
import { OpportunityMapData, useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Schema para um campo de dados genérico
const dataEntrySchema = z.object({
  key: z.string().min(1, 'A chave do campo é obrigatória.'),
  value: z.string().min(1, 'O valor é obrigatório.'),
});

const formSchema = z.object({
  data: z.array(dataEntrySchema),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Collaborator;
  section: string; // Now a generic section ID (opportunityTypeId)
  sectionTitle: string;
  opportunityData: OpportunityMapData | undefined;
}

export function EditDataModal({ isOpen, onClose, user, section, sectionTitle, opportunityData }: EditDataModalProps) {
    const { upsertOpportunityData } = useOpportunityMap();
    
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            data: opportunityData && opportunityData[section] 
                ? Object.entries(opportunityData[section]).map(([key, value]) => ({ key, value: String(value) }))
                : [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "data",
    });

    const onSubmit = async (values: FormValues) => {
        try {
            const dataToSave = values.data.reduce((acc, { key, value }) => {
                if (key) acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            
            await upsertOpportunityData(user.id, {
                userName: user.name,
                [section]: dataToSave
            });
            
            toast({
                title: "Dados Salvos!",
                description: `Os dados da seção "${sectionTitle}" para ${user.name} foram atualizados.`,
            });
            onClose();

        } catch (error) {
            toast({
                title: "Erro ao Salvar",
                description: (error as Error).message,
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar Dados: {sectionTitle}</DialogTitle>
                    <DialogDescription>Gerencie os dados para o colaborador: <strong>{user.name}</strong></DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ScrollArea className="max-h-[60vh] p-1">
                        <div className="space-y-4 pr-4">
                            {fields.map((field, index) => {
                               const fieldErrors = errors.data?.[index] as any;
                                return (
                                <div key={field.id} className="grid grid-cols-2 gap-x-2 gap-y-3 p-3 border rounded-lg bg-muted/50 relative">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-1 right-1 h-7 w-7">
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                    <div className="col-span-1 space-y-1.5">
                                        <Label htmlFor={`data.${index}.key`}>Chave</Label>
                                        <Input id={`data.${index}.key`} {...register(`data.${index}.key`)} placeholder="Ex: NPS" />
                                        {fieldErrors?.key && <p className="text-sm text-destructive">{fieldErrors.key.message}</p>}
                                    </div>
                                    <div className="col-span-1 space-y-1.5">
                                        <Label htmlFor={`data.${index}.value`}>Valor</Label>
                                        <Input id={`data.${index}.value`} {...register(`data.${index}.value`)} placeholder="Ex: 9.5" />
                                        {fieldErrors?.value && <p className="text-sm text-destructive">{fieldErrors.value.message}</p>}
                                    </div>
                                </div>
                            )})}
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Campo
                            </Button>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-6 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
