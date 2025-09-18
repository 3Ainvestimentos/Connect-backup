"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOpportunityTypes, OpportunityType, opportunityTypeSchema } from '@/contexts/OpportunityMapMissionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RecipientSelectionModal } from '@/components/admin/RecipientSelectionModal';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

type OpportunityTypeFormValues = z.infer<typeof opportunityTypeSchema>;

export function OpportunityTypesManager() {
  const { opportunityTypes, addOpportunityType, updateOpportunityType, deleteOpportunityType, loading } = useOpportunityTypes();
  const { collaborators } = useCollaborators();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [editingOpportunityType, setEditingOpportunityType] = useState<OpportunityType | null>(null);

  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<OpportunityTypeFormValues>({
    resolver: zodResolver(opportunityTypeSchema),
    defaultValues: { name: '', description: '', recipientIds: ['all'] },
  });
  
  const watchRecipientIds = watch('recipientIds');

  const handleOpenForm = (opportunityType: OpportunityType | null) => {
    setEditingOpportunityType(opportunityType);
    if (opportunityType) {
      reset(opportunityType);
    } else {
      reset({ name: '', description: '', recipientIds: ['all'] });
    }
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este tipo de oportunidade? Todos os dados associados serão perdidos.")) return;
    try {
      await deleteOpportunityType(id);
      toast({ title: "Tipo de Oportunidade Excluído", description: "O tipo de oportunidade foi removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao Excluir", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onSubmit = async (data: OpportunityTypeFormValues) => {
    try {
      if (editingOpportunityType) {
        await updateOpportunityType({ ...data, id: editingOpportunityType.id });
        toast({ title: "Tipo de Oportunidade Atualizado", description: "O tipo de oportunidade foi salvo." });
      } else {
        await addOpportunityType(data);
        toast({ title: "Tipo de Oportunidade Criado", description: "O novo tipo de oportunidade foi adicionado." });
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: (error as Error).message, variant: "destructive" });
    }
  };

    const getRecipientDescription = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Nenhum destinatário';
        if (ids.includes('all')) return 'Todos os Colaboradores';
        return `${ids.length} colaborador(es) selecionado(s)`;
    };
  
  const renderSkeleton = () => (
    [...Array(3)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tipos de Oportunidades</CardTitle>
            <CardDescription>Crie os tipos de oportunidades que estarão disponíveis para os colaboradores.</CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)} className="bg-admin-primary hover:bg-admin-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Oportunidade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Público-Alvo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? renderSkeleton() : opportunityTypes.map(opType => (
                  <TableRow key={opType.id}>
                    <TableCell className="font-medium">{opType.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{opType.description}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{getRecipientDescription(opType.recipientIds)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(opType)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(opType.id)}>
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
            <DialogTitle>{editingOpportunityType ? 'Editar Tipo de Oportunidade' : 'Novo Tipo de Oportunidade'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name')} placeholder="Ex: Campanha de Vendas de Maio" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea id="description" {...register('description')} placeholder="Breve descrição sobre esta oportunidade..." />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <Label>Público-Alvo</Label>
              <Button type="button" variant="outline" className="w-full justify-start text-left mt-1" onClick={() => setIsSelectionModalOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{getRecipientDescription(watchRecipientIds)}</span>
              </Button>
              {errors.recipientIds && <p className="text-sm text-destructive mt-1">{errors.recipientIds.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <RecipientSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        allCollaborators={collaborators}
        selectedIds={watchRecipientIds}
        onConfirm={(newIds) => {
            setValue('recipientIds', newIds, { shouldValidate: true });
            setIsSelectionModalOpen(false);
        }}
       />
    </>
  );
}
