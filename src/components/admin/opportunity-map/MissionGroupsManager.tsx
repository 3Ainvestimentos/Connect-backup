"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMissionGroups, MissionGroup, missionGroupSchema } from '@/contexts/MissionGroupsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, SlidersHorizontal, HelpCircle, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { availableLogicTypes } from '@/lib/gamification-logics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';


type MissionGroupFormValues = z.infer<typeof missionGroupSchema>;

interface MissionGroupsManagerProps {
    opportunityTypeId: string;
    selectedGroupId: string | null;
    onSelectGroup: (id: string | null) => void;
}

export function MissionGroupsManager({ opportunityTypeId, selectedGroupId, onSelectGroup }: MissionGroupsManagerProps) {
  const { missionGroups, addMissionGroup, updateMissionGroup, deleteMissionGroup, loading } = useMissionGroups(opportunityTypeId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MissionGroup | null>(null);

  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<MissionGroupFormValues>({
    resolver: zodResolver(missionGroupSchema),
    defaultValues: { name: '', logicType: 'tieredReward', rules: [{ count: 1, reward: 0 }], objectives: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'rules' });
  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({ control, name: 'objectives' });

  const watchLogicType = watch('logicType');
  const selectedLogicDetails = availableLogicTypes.find(l => l.value === watchLogicType);

  const handleOpenForm = (group: MissionGroup | null) => {
    setEditingGroup(group);
    if (group) {
      reset(group);
    } else {
      reset({ name: '', logicType: 'tieredReward', rules: [{ count: 1, reward: 0 }], objectives: [] });
    }
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este grupo? Objetivos associados a ele perderão sua lógica de premiação especial.")) return;
    try {
      if (selectedGroupId === id) {
        onSelectGroup(null);
      }
      await deleteMissionGroup(id);
      toast({ title: "Grupo Excluído", description: "O grupo de objetivos foi removido." });
    } catch (error) {
      toast({ title: "Erro ao Excluir", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onSubmit = async (data: MissionGroupFormValues) => {
    try {
      if (editingGroup) {
        await updateMissionGroup({ ...data, id: editingGroup.id });
        toast({ title: "Grupo Atualizado", description: "O grupo de objetivos foi salvo." });
      } else {
        await addMissionGroup(data);
        toast({ title: "Grupo Criado", description: "O novo grupo de objetivos foi adicionado." });
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: (error as Error).message, variant: "destructive" });
    }
  };

  const renderSkeleton = () => (
    [...Array(2)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
      </TableRow>
    ))
  );

  const renderRulesForLogicType = () => {
    const selectedLogic = availableLogicTypes.find(l => l.value === watchLogicType);

    switch(selectedLogic?.ruleCount) {
        case 'single':
            if (fields.length !== 1) replace([{ count: 1, reward: 0 }]);
            return (
                 <div className="flex items-end gap-2 p-2 border rounded-md">
                    {selectedLogic.ruleFields.includes('count') && (
                        <div className="flex-grow">
                            <Label htmlFor="rules.0.count">Total de objetivos no grupo</Label>
                            <Input id="rules.0.count" type="number" {...register(`rules.0.count`, { valueAsNumber: true })} />
                        </div>
                    )}
                    <div className="flex-grow">
                        <Label htmlFor="rules.0.reward">Valor da Recompensa (R$)</Label>
                        <Input id="rules.0.reward" type="number" {...register(`rules.0.reward`, { valueAsNumber: true })} />
                    </div>
                </div>
            );
        case 'dual':
            if (fields.length !== 2) replace([{ count: 1, reward: 0 }, { count: 2, reward: 0 }]);
            return(
                <div className="space-y-2">
                    <div className="flex-grow">
                        <Label htmlFor="rules.0.reward">Prêmio Base (pelo 1º objetivo)</Label>
                        <Input id="rules.0.reward" type="number" {...register(`rules.0.reward`, { valueAsNumber: true })} />
                    </div>
                    <div className="flex-grow">
                        <Label htmlFor="rules.1.reward">Bônus por Objetivo Adicional</Label>
                        <Input id="rules.1.reward" type="number" {...register(`rules.1.reward`, { valueAsNumber: true })} />
                    </div>
                </div>
            )
        case 'multiple':
        default: // Tiered reward
            return (
                 <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="flex-grow">
                          <Label htmlFor={`rules.${index}.count`}>Se completar ({'>='})</Label>
                          <Input id={`rules.${index}.count`} type="number" {...register(`rules.${index}.count`, { valueAsNumber: true })} />
                        </div>
                        <div className="flex-grow">
                          <Label htmlFor={`rules.${index}.reward`}>O prêmio é (R$)</Label>
                          <Input id={`rules.${index}.reward`} type="number" {...register(`rules.${index}.reward`, { valueAsNumber: true })} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ count: fields.length + 1, reward: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Faixa
                    </Button>
                 </div>
            );
    }
  }


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><SlidersHorizontal/> Gerenciar Grupos de Objetivos</CardTitle>
            <CardDescription>Crie e edite grupos com lógicas de premiação condicional para esta oportunidade.</CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)} className="bg-admin-primary hover:bg-admin-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Grupo</TableHead>
                  <TableHead>Tipo de Lógica</TableHead>
                  <TableHead>Regras</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? renderSkeleton() : missionGroups.map(group => (
                  <TableRow 
                    key={group.id}
                    onClick={() => onSelectGroup(group.id)}
                    className={cn(
                        "cursor-pointer",
                        selectedGroupId === group.id && "bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium"><Badge variant="outline">{group.name}</Badge></TableCell>
                    <TableCell>{availableLogicTypes.find(l => l.value === group.logicType)?.label || group.logicType}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {group.rules.map(rule => `Se >= ${rule.count} objetivos, prêmio = R$ ${rule.reward}`).join('; ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenForm(group); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!loading && missionGroups.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4">Nenhum grupo de objetivos foi criado ainda para esta oportunidade.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
          <TooltipProvider>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingGroup ? 'Editar Grupo de Objetivos' : 'Novo Grupo de Objetivos'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col min-h-0">
              <ScrollArea className="flex-grow px-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Nome do Grupo</Label>
                    <Input id="name" {...register('name')} placeholder="Ex: VENDAS_TIME_A" />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="logicType">Tipo de Lógica</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs z-[60]">
                          <p className="font-medium text-sm mb-1">{selectedLogicDetails?.label}</p>
                          <p className="text-xs text-muted-foreground">{selectedLogicDetails?.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select onValueChange={(value) => setValue('logicType', value)} defaultValue={watchLogicType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableLogicTypes.map(logic => (
                          <SelectItem key={logic.value} value={logic.value}>
                            {logic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.logicType && <p className="text-sm text-destructive mt-1">{errors.logicType.message}</p>}
                  </div>

                  <div>
                    <Label>Regras de Premiação</Label>
                    {renderRulesForLogicType()}
                    {errors.rules?.root && <p className="text-sm text-destructive mt-1">{errors.rules?.root?.message}</p>}
                  </div>

                  <Separator />

                  <div>
                    <Label className="flex items-center gap-2"><Target/> Objetivos do Grupo</Label>
                    <p className="text-xs text-muted-foreground mb-2">Defina os nomes das colunas do seu CSV que fazem parte deste grupo.</p>
                    <div className="space-y-2">
                      {objectiveFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <Input
                            {...register(`objectives.${index}`)}
                            placeholder={`Ex: OBJETIVO_NPS`}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeObjective(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {errors.objectives && <p className="text-sm text-destructive mt-1">{errors.objectives.root?.message}</p>}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendObjective('')} className="mt-2">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Objetivo
                    </Button>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Grupo
                </Button>
              </DialogFooter>
            </form>
          </TooltipProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
