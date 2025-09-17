
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useOpportunityMap, opportunityMapSchema, sectionSchema } from '@/contexts/OpportunityMapContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const formSchema = opportunityMapSchema.omit({ id: true, userId: true, userName: true });
type FormValues = z.infer<typeof formSchema>;

function SectionForm({ nest, control, register, errors }: { nest: any, control: any, register: any, errors: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: nest,
    });

    return (
        <div className="space-y-4">
            {fields.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div className="space-y-1">
                           <Label htmlFor={`${nest}.${index}.key`}>Chave</Label>
                           <Input
                             {...register(`${nest}.${index}.key`)}
                             placeholder="Ex: Novos Contratos"
                           />
                        </div>
                        <div className="space-y-1">
                           <Label htmlFor={`${nest}.${index}.value`}>Valor</Label>
                           <Input
                             {...register(`${nest}.${index}.value`)}
                             placeholder="Ex: R$ 1.500,00"
                           />
                        </div>
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: '', value: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Campo
            </Button>
        </div>
    );
}


export default function OpportunityMapAdminPage() {
    const { collaborators } = useCollaborators();
    const { opportunityData, upsertOpportunityData, loading } = useOpportunityMap();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const commercialUsers = useMemo(() => {
        const testUsers = [
            'desenvolvedor@3ariva.com.br',
            'matheus@3ainvestimentos.com.br'
        ];
        return collaborators.filter(c => c.axis === 'Comercial' || testUsers.includes(c.email));
    }, [collaborators]);
    
    const form = useForm<any>({
        defaultValues: {
            missionsXp: [],
            pap: [],
        },
    });
    
    const { register, control, handleSubmit, reset, formState: { isSubmitting, errors } } = form;

    const missionsXpArray = useFieldArray({ control, name: "missionsXp" });
    const papArray = useFieldArray({ control, name: "pap" });
    
    useEffect(() => {
        if (selectedUserId) {
            const data = opportunityData.find(d => d.userId === selectedUserId);
            const formatForFieldArray = (sectionData: Record<string, string> | undefined) => {
                return sectionData ? Object.entries(sectionData).map(([key, value]) => ({ key, value })) : [];
            };

            reset({
                missionsXp: formatForFieldArray(data?.missionsXp),
                pap: formatForFieldArray(data?.pap),
            });
        } else {
            reset({
                missionsXp: [],
                pap: [],
            });
        }
    }, [selectedUserId, opportunityData, reset]);

    const onSubmit = async (data: any) => {
        if (!selectedUserId) return;
        
        const selectedUser = commercialUsers.find(c => c.id3a === selectedUserId);
        if (!selectedUser) return;

        // Convert field arrays back to objects
        const formatForFirestore = (arr: { key: string, value: string }[] | undefined) => {
            if (!arr) return {};
            return arr.reduce((acc, { key, value }) => {
                if (key) acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
        };
        
        const payload = {
            userName: selectedUser.name,
            missionsXp: formatForFirestore(data.missionsXp),
            pap: formatForFirestore(data.pap),
        };

        try {
            await upsertOpportunityData(selectedUserId, payload);
            toast({ title: 'Sucesso!', description: `Dados para ${selectedUser.name} foram salvos.` });
        } catch (error) {
            toast({ title: 'Erro!', description: `Não foi possível salvar os dados.`, variant: 'destructive' });
            console.error(error);
        }
    };
    
    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Admin: Mapa de Oportunidades"
                    description="Gerencie os dados de resultado mensal dos colaboradores do Eixo Comercial."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Seleção de Colaborador</CardTitle>
                        <div className="w-full md:w-1/3">
                            <Label htmlFor="collaborator-select">Colaborador Comercial</Label>
                             <Select onValueChange={setSelectedUserId} value={selectedUserId || undefined}>
                                <SelectTrigger id="collaborator-select">
                                    <SelectValue placeholder="Selecione um colaborador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {commercialUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id3a}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    {selectedUserId && (
                        <CardContent>
                             <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Missões XP</CardTitle>
                                        <CardDescription>Insira os dados relacionados às missões de XP.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SectionForm nest="missionsXp" control={control} register={register} errors={errors} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>PAP (Plano de Ação Pessoal)</CardTitle>
                                        <CardDescription>Insira os dados relacionados ao PAP.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <SectionForm nest="pap" control={control} register={register} errors={errors} />
                                    </CardContent>
                                </Card>
                                
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Dados
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    )}
                </Card>
            </div>
        </SuperAdminGuard>
    );
}



    