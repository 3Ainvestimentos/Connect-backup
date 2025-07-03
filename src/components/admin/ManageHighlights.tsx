"use client";
import React, { useState } from 'react';
import { useHighlights, Highlight } from '@/contexts/HighlightsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

const highlightSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
    imageUrl: z.string().url("URL da imagem inválida"),
    link: z.string().url("URL do link inválida"),
    dataAiHint: z.string().optional(),
});

type HighlightFormValues = z.infer<typeof highlightSchema>;

export function ManageHighlights() {
    const { highlights, addHighlight, updateHighlight, deleteHighlight, toggleHighlightActive } = useHighlights();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<HighlightFormValues>({
        resolver: zodResolver(highlightSchema),
    });

    const handleDialogOpen = (highlight: Highlight | null) => {
        setEditingHighlight(highlight);
        if (highlight) {
            reset(highlight);
        } else {
            reset({
                id: undefined,
                title: '',
                description: '',
                imageUrl: 'https://placehold.co/600x400.png',
                link: '#',
                dataAiHint: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este destaque?")) {
            deleteHighlight(id);
            toast({ title: "Destaque excluído com sucesso." });
        }
    };
    
    const onSubmit = (data: HighlightFormValues) => {
        if (editingHighlight) {
            updateHighlight({ ...editingHighlight, ...data });
            toast({ title: "Destaque atualizado com sucesso." });
        } else {
            addHighlight(data);
            toast({ title: "Destaque adicionado com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingHighlight(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Destaques</CardTitle>
                    <CardDescription>Adicione, edite ou remova destaques da página inicial. Ative até 3.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Destaque
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Imagem</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Ativo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {highlights.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Image src={item.imageUrl} alt={item.title} width={80} height={50} className="rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={item.isActive}
                                            onCheckedChange={() => toggleHighlightActive(item.id)}
                                            aria-label="Ativar destaque"
                                        />
                                    </TableCell>
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

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingHighlight(null); setIsDialogOpen(isOpen); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingHighlight ? 'Editar Destaque' : 'Adicionar Destaque'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" {...register('description')} />
                            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="imageUrl">URL da Imagem</Label>
                            <Input id="imageUrl" {...register('imageUrl')} placeholder="https://placehold.co/600x400.png"/>
                            {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="link">URL do Link</Label>
                            <Input id="link" {...register('link')} placeholder="#"/>
                            {errors.link && <p className="text-sm text-destructive mt-1">{errors.link.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="dataAiHint">Dica para IA da Imagem (opcional)</Label>
                            <Input id="dataAiHint" {...register('dataAiHint')} placeholder="ex: business meeting" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
