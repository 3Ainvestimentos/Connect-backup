"use client";
import React, { useState } from 'react';
import { useNews } from '@/contexts/NewsContext';
import type { NewsItemType } from '@/contexts/NewsContext';
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
import { Switch } from '../ui/switch';

const newsSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    snippet: z.string().min(10, "Snippet deve ter no mínimo 10 caracteres"),
    category: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    imageUrl: z.string().url("URL da imagem inválida").or(z.literal("")),
    dataAiHint: z.string().optional(),
    link: z.string().optional(),
    isHighlight: z.boolean().optional(),
});

type NewsFormValues = z.infer<typeof newsSchema>;

export function ManageNews() {
    const { newsItems, addNewsItem, updateNewsItem, deleteNewsItem, toggleNewsHighlight } = useNews();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItemType | null>(null);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            isHighlight: false,
        }
    });

    const handleDialogOpen = (newsItem: NewsItemType | null) => {
        setEditingNews(newsItem);
        if (newsItem) {
            const formattedNews = {
              ...newsItem,
              date: new Date(newsItem.date).toISOString().split('T')[0],
            };
            reset(formattedNews);
        } else {
            reset({
                id: undefined,
                title: '',
                snippet: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                imageUrl: 'https://placehold.co/300x200.png',
                dataAiHint: '',
                link: '',
                isHighlight: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta notícia?")) {
            deleteNewsItem(id);
            toast({ title: "Notícia excluída com sucesso." });
        }
    };
    
    const onSubmit = (data: NewsFormValues) => {
        const currentlyActive = newsItems.filter(n => n.isHighlight && n.id !== editingNews?.id).length;
        if(data.isHighlight && currentlyActive >= 3) {
             toast({
                title: "Limite de destaques atingido",
                description: "Por favor, desative outro destaque antes de ativar este.",
                variant: "destructive",
            });
            return;
        }

        if (editingNews) {
            updateNewsItem({ ...editingNews, ...data });
            toast({ title: "Notícia atualizada com sucesso." });
        } else {
            addNewsItem(data);
            toast({ title: "Notícia adicionada com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingNews(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Notícias</CardTitle>
                    <CardDescription>Adicione, edite ou remova notícias do feed. Marque até 3 para destaque.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Notícia
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Destaque</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {newsItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={item.isHighlight}
                                            onCheckedChange={() => toggleNewsHighlight(item.id)}
                                            aria-label="Marcar como destaque"
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

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingNews(null); setIsDialogOpen(isOpen); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingNews ? 'Editar Notícia' : 'Adicionar Notícia'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="snippet">Snippet</Label>
                            <Textarea id="snippet" {...register('snippet')} />
                            {errors.snippet && <p className="text-sm text-destructive mt-1">{errors.snippet.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="category">Categoria</Label>
                            <Input id="category" {...register('category')} />
                            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="date">Data</Label>
                            <Input id="date" type="date" {...register('date')} />
                            {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="imageUrl">URL da Imagem</Label>
                            <Input id="imageUrl" {...register('imageUrl')} placeholder="https://placehold.co/300x200.png"/>
                            {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="link">URL do Link (opcional)</Label>
                            <Input id="link" {...register('link')} placeholder="https://..."/>
                            {errors.link && <p className="text-sm text-destructive mt-1">{errors.link.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="dataAiHint">Dica para IA da Imagem (opcional)</Label>
                            <Input id="dataAiHint" {...register('dataAiHint')} placeholder="ex: business meeting" />
                        </div>
                        <div className="flex items-center space-x-2">
                           <Controller
                                name="isHighlight"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="isHighlight"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="isHighlight">Marcar como Destaque</Label>
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
