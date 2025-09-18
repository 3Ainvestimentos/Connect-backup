
"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOpportunityMapMissions, MissionDefinition, missionDefinitionSchema } from '@/contexts/OpportunityMapMissionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type MissionFormValues = z.infer<typeof missionDefinitionSchema>;

export function MissionDefinitionsManager() {
  const { missions, addMission, updateMission, deleteMission, loading } = useOpportunityMapMissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<MissionDefinition | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MissionFormValues>({
    resolver: zodResolver(missionDefinitionSchema),
    defaultValues: { title: '', maxValue: '0', notes: '', group: '' },
  });
  
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0; // Fallback if createdAt is missing
    });
  }, [missions]);

  const handleOpenForm = (mission: MissionDefinition | null) => {
    setEditingMission(mission);
    if (mission) {
      reset(mission);
    } else {
      reset({ title: '', maxValue: '0', notes: '', group: '' });
    }
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta missão? Ela será removida da elegibilidade de todos os usuários.")) return;
    try {
      await deleteMission(id);
      toast({ title: "Missão Excluída", description: "A definição da missão foi removida com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao Excluir", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onSubmit = async (data: MissionFormValues) => {
    try {
      if (editingMission) {
        await updateMission({ ...data, id: editingMission.id });
        toast({ title: "Missão Atualizada", description: "A definição da missão foi salva." });
      } else {
        await addMission(data);
        toast({ title: "Missão Criada", description: "A nova missão foi adicionada ao pool." });
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const renderSkeleton = () => (
    [...Array(3)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Definições de Missões XP</CardTitle>
            <CardDescription>Crie o pool de missões que estarão disponíveis para o mês.</CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)} className="bg-admin-primary hover:bg-admin-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Missão
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título da Missão</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Valor Máximo (R$)</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? renderSkeleton() : sortedMissions.map(mission => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.title}</TableCell>
                    <TableCell>
                      {mission.group ? <Badge variant="secondary">{mission.group}</Badge> : '-'}
                    </TableCell>
                    <TableCell>{mission.maxValue}</TableCell>
                    <TableCell className="max-w-xs truncate">{mission.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(mission)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(mission.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMission ? 'Editar Missão' : 'Nova Missão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register('title')} placeholder="Ex: Novos Contratos (Nível 1)" />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="group">Grupo (Opcional)</Label>
              <Input id="group" {...register('group')} placeholder="Ex: GRUPO_ASSESSOR" />
              <p className="text-xs text-muted-foreground mt-1">
                Agrupe missões para aplicar lógicas de premiação condicionais.
              </p>
            </div>
            <div>
              <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
              <Input id="maxValue" {...register('maxValue')} placeholder="Ex: 1500.00"/>
              <p className="text-xs text-muted-foreground mt-1">
                Se a missão faz parte de um grupo, este valor pode ser ignorado.
              </p>
              {errors.maxValue && <p className="text-sm text-destructive mt-1">{errors.maxValue.message}</p>}
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Detalhes ou regras da missão..." />
              {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Missão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
