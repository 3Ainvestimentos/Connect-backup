
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMissionGroups, MissionGroup } from '@/contexts/MissionGroupsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Loader2, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const objectivesFormSchema = z.object({
  objectives: z.array(z.string().min(1, 'O nome do objetivo não pode ser vazio.')),
});

type ObjectivesFormValues = z.infer<typeof objectivesFormSchema>;

interface ObjectivesManagerProps {
  opportunityTypeId: string;
  groupId: string;
}

export function ObjectivesManager({ opportunityTypeId, groupId }: ObjectivesManagerProps) {
  const { missionGroups, updateMissionGroup, loading } = useMissionGroups(opportunityTypeId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGroup = React.useMemo(() => {
    return missionGroups.find(g => g.id === groupId);
  }, [missionGroups, groupId]);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<ObjectivesFormValues>({
    resolver: zodResolver(objectivesFormSchema),
    defaultValues: {
      objectives: selectedGroup?.objectives || [],
    },
  });

  useEffect(() => {
    if (selectedGroup) {
      reset({ objectives: selectedGroup.objectives || [] });
    }
  }, [selectedGroup, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "objectives",
  });

  const onSubmit = async (data: ObjectivesFormValues) => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await updateMissionGroup({ id: selectedGroup.id, objectives: data.objectives });
      toast({
        title: "Objetivos Salvos",
        description: `Os objetivos para o grupo "${selectedGroup.name}" foram atualizados.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedGroup) {
    return null; // Don't render if no group is selected
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target/> Gerenciar Objetivos do Grupo: {selectedGroup.name}</CardTitle>
        <CardDescription>Defina os nomes dos objetivos que pertencem a este grupo. Estes nomes devem corresponder às colunas do seu arquivo CSV.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`objectives.${index}`)}
                  placeholder={`Ex: OBJETIVO_${index + 1}`}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.objectives && (
              <p className="text-sm text-destructive mt-1">{errors.objectives.root?.message}</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Objetivo
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Objetivos
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
