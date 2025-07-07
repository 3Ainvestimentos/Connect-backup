
"use client";
import React, { useState } from 'react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

const collaboratorSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    axis: z.string().min(1, "Eixo é obrigatório"),
    area: z.string().min(1, "Área é obrigatória"),
    position: z.string().min(1, "Cargo é obrigatório"),
    leader: z.string().min(1, "Líder é obrigatório"),
    segment: z.string().min(1, "Segmento é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
});

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>;

export function ManageCollaborators() {
    const { collaborators, addCollaborator, updateCollaborator, deleteCollaborator } = useCollaborators();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CollaboratorFormValues>({
        resolver: zodResolver(collaboratorSchema),
    });

    const handleDialogOpen = (collaborator: Collaborator | null) => {
        setEditingCollaborator(collaborator);
        if (collaborator) {
            reset(collaborator);
        } else {
            reset({
                id: undefined,
                name: '',
                email: '',
                axis: '',
                area: '',
                position: '',
                leader: '',
                segment: '',
                city: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este colaborador?")) {
            deleteCollaborator(id);
            toast({ title: "Colaborador excluído com sucesso." });
        }
    };
    
    const onSubmit = (data: CollaboratorFormValues) => {
        if (editingCollaborator) {
            updateCollaborator({ ...editingCollaborator, ...data });
            toast({ title: "Colaborador atualizado com sucesso." });
        } else {
            const { id, ...dataWithoutId } = data;
            addCollaborator(dataWithoutId as Omit<Collaborator, 'id'>);
            toast({ title: "Colaborador adicionado com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingCollaborator(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Colaboradores</CardTitle>
                    <CardDescription>Adicione, edite ou remova colaboradores da lista.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Colaborador
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Líder</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collaborators.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.email}</TableCell>
                                    <TableCell>{item.area}</TableCell>
                                    <TableCell>{item.position}</TableCell>
                                    <TableCell>{item.leader}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingCollaborator(null); setIsDialogOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingCollaborator ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...register('email')} />
                                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="axis">Eixo</Label>
                                <Input id="axis" {...register('axis')} />
                                {errors.axis && <p className="text-sm text-destructive mt-1">{errors.axis.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="area">Área</Label>
                                <Input id="area" {...register('area')} />
                                {errors.area && <p className="text-sm text-destructive mt-1">{errors.area.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="position">Cargo</Label>
                                <Input id="position" {...register('position')} />
                                {errors.position && <p className="text-sm text-destructive mt-1">{errors.position.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="leader">Líder</Label>
                                <Input id="leader" {...register('leader')} />
                                {errors.leader && <p className="text-sm text-destructive mt-1">{errors.leader.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="segment">Segmento</Label>
                                <Input id="segment" {...register('segment')} />
                                {errors.segment && <p className="text-sm text-destructive mt-1">{errors.segment.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="city">Cidade</Label>
                                <Input id="city" {...register('city')} />
                                {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                  </div>
                  </ScrollArea>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
