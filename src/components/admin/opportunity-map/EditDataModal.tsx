
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
import { OpportunityMapData, useOpportunityMap, missionSchema } from '@/contexts/OpportunityMapContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


const missionEntrySchema = z.object({
  key: z.string().min(1, 'A chave da missão é obrigatória.'),
  value: z.string().min(1, 'O valor é obrigatório.'),
  status: z.enum(['elegivel', 'premiado']).default('elegivel'),
});

const papEntrySchema = z.object({
  key: z.string().min(1, 'A chave é obrigatória.'),
  value: z.string().min(1, 'O valor é obrigatório.'),
});


const formSchema = z.object({
  data: z.array(z.union([missionEntrySchema, papEntrySchema])),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Collaborator;
  section: 'missionsXp' | 'pap';
  sectionTitle: string;
  opportunityData: OpportunityMapData | undefined;
}

export function EditDataModal({ isOpen, onClose, user, section, sectionTitle, opportunityData }: EditDataModalProps) {
    const { updateSectionData } = useOpportunityMap();
    
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            data: opportunityData && opportunityData[section] 
                ? Object.entries(opportunityData[section]).map(([key, value]) => {
                    if (section === 'missionsXp' && typeof value === 'object' && value !== null) {
                        return { key, value: (value as any).value, status: (value as any).status };
                    }
                    return { key, value: String(value) };
                })
                : [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "data",
    });

    const onSubmit = async (values: FormValues) => {
        try {
            let dataToSave: Record<string, any>;
             if (section === 'missionsXp') {
                dataToSave = (values.data as z.infer<typeof missionEntrySchema>[]).reduce((acc, { key, value, status }) => {
                    if (key) acc[key] = { value, status };
                    return acc;
                }, {} as Record<string, { value: string; status: 'elegivel' | 'premiado' }>);
            } else {
                 dataToSave = (values.data as z.infer<typeof papEntrySchema>[]).reduce((acc, { key, value }) => {
                    if (key) acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
            }
            
            await updateSectionData(user.id, section, dataToSave);
            
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
                                <div key={field.id} className="grid grid-cols-1 gap-y-3 gap-x-2 p-3 border rounded-lg bg-muted/50 relative">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-1 right-1 h-7 w-7">
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                    <div className="flex-grow space-y-1.5">
                                        <Label htmlFor={`data.${index}.key`}>Chave</Label>
                                        <Input id={`data.${index}.key`} {...register(`data.${index}.key`)} placeholder="Ex: NPS" />
                                        {fieldErrors?.key && <p className="text-sm text-destructive">{fieldErrors.key.message}</p>}
                                    </div>
                                    <div className={cn("grid gap-2", section === 'missionsXp' ? "grid-cols-2" : "grid-cols-1")}>
                                        <div className="flex-grow space-y-1.5">
                                            <Label htmlFor={`data.${index}.value`}>Valor</Label>
                                            <Input id={`data.${index}.value`} {...register(`data.${index}.value`)} placeholder={section === 'missionsXp' ? "Ex: 1500.00" : "Ex: 9.5"} />
                                            {fieldErrors?.value && <p className="text-sm text-destructive">{fieldErrors.value.message}</p>}
                                        </div>
                                         {section === 'missionsXp' && (
                                            <div className="flex-grow space-y-1.5">
                                                <Label htmlFor={`data.${index}.status`}>Status</Label>
                                                <Controller
                                                    control={control}
                                                    name={`data.${index}.status` as any}
                                                    defaultValue="elegivel"
                                                    render={({ field: controllerField }) => (
                                                        <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                                                            <SelectTrigger id={`data.${index}.status`}>
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="elegivel">Elegível</SelectItem>
                                                                <SelectItem value="premiado">Premiado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                            <Button type="button" variant="outline" size="sm" onClick={() => append(section === 'missionsXp' ? { key: '', value: '', status: 'elegivel' } : { key: '', value: '' })}>
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
