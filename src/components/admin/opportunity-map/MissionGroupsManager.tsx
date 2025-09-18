
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
import { PlusCircle, Edit, Trash2, Loader2, SlidersHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { availableLogicTypes } from '@/lib/gamification-logics';

type MissionGroupFormValues = z.infer<typeof missionGroupSchema>;

export function MissionGroupsManager() {
  const { missionGroups, addMissionGroup, updateMissionGroup, deleteMissionGroup, loading } = useMissionGroups();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MissionGroup | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MissionGroupFormValues>({
    resolver: zodResolver(missionGroupSchema),
    defaultValues: { name: '', logicType: '', rules: [{ count: 1, reward: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });

  const handleOpenForm = (group: MissionGroup | null) => {
    setEditingGroup(group);
    if (group) {
      reset(group);
    } else {
      reset({ name: '', logicType: 'tieredReward', rules: [{ count: 1, reward: 0 }] });
    }
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este grupo? Missões associadas a ele perderão sua lógica de premiação especial.")) return;
    try {
      await deleteMissionGroup(id);
      toast({ title: "Grupo Excluído", description: "O grupo de missões foi removido." });
    } catch (error) {
      toast({ title: "Erro ao Excluir", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onSubmit = async (data: MissionGroupFormValues) => {
    try {
      if (editingGroup) {
        await updateMissionGroup({ ...data, id: editingGroup.id });
        toast({ title: "Grupo Atualizado", description: "O grupo de missões foi salvo." });
      } else {
        await addMissionGroup(data);
        toast({ title: "Grupo Criado", description: "O novo grupo de missões foi adicionado." });
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Grupos de Missões</CardTitle>
            <CardDescription>Crie e edite grupos com lógicas de premiação condicional.</CardDescription>
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
                  <TableRow key={group.id}>
                    <TableCell className="font-medium"><Badge variant="outline">{group.name}</Badge></TableCell>
                    <TableCell>{availableLogicTypes.find(l => l.value === group.logicType)?.label || group.logicType}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {group.rules.map(rule => `Se >= ${rule.count} missões, prêmio = R$ ${rule.reward}`).join('; ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(group)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!loading && missionGroups.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4">Nenhum grupo de missão foi criado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGroup ? 'Editar Grupo de Missões' : 'Novo Grupo de Missões'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input id="name" {...register('name')} placeholder="Ex: GRUPO_ASSESSOR" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="logicType">Tipo de Lógica</Label>
              <Select onValueChange={(value) => reset({ ...watch(), logicType: value })} defaultValue={watch('logicType')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableLogicTypes.map(logic => (
                    <SelectItem key={logic.value} value={logic.value}>{logic.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.logicType && <p className="text-sm text-destructive mt-1">{errors.logicType.message}</p>}
            </div>
            <div>
              <Label>Regras de Premiação</Label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="flex-grow">
                      <Label htmlFor={`rules.${index}.count`}>Se completar (>=)</Label>
                      <Input id={`rules.${index}.count`} type="number" {...register(`rules.${index}.count`)} />
                      {errors.rules?.[index]?.count && <p className="text-xs text-destructive mt-1">{errors.rules[index]?.count?.message}</p>}
                    </div>
                    <div className="flex-grow">
                      <Label htmlFor={`rules.${index}.reward`}>O prêmio é (R$)</Label>
                      <Input id={`rules.${index}.reward`} type="number" {...register(`rules.${index}.reward`)} />
                       {errors.rules?.[index]?.reward && <p className="text-xs text-destructive mt-1">{errors.rules[index]?.reward?.message}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ count: fields.length + 1, reward: 0 })} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Regra
              </Button>
               {errors.rules?.root && <p className="text-sm text-destructive mt-1">{errors.rules?.root?.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Grupo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
