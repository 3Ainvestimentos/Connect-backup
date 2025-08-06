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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const newsSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    snippet: z.string().min(10, "Snippet deve ter no mínimo 10 caracteres"),
    content: z.string().min(10, "Conteúdo completo deve ter no mínimo 10 caracteres"),
    category: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    imageUrl: z.string().url("URL da imagem inválida").or(z.literal("")),
    videoUrl: z.string().url("URL do vídeo inválida").optional().or(z.literal('')),
    link: z.string().optional(),
    isHighlight: z.boolean().optional(),
    highlightType: z.enum(['large', 'small']).optional(),
});

type NewsFormValues = Omit<z.infer<typeof newsSchema>, 'isHighlight' | 'highlightType'>;

export function ManageNews() {
    const { newsItems, addNewsItem, updateNewsItem, deleteNewsItemMutation, toggleNewsHighlight, updateHighlightType } = useNews();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItemType | null>(null);

    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting: isFormSubmitting } } = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema.omit({ isHighlight: true, highlightType: true })),
    });

    const handleDialogOpen = (newsItem: NewsItemType | null) => {
        setEditingNews(newsItem);
        if (newsItem) {
            const formattedNews = {
              ...newsItem,
              date: new Date(newsItem.date).toISOString().split('T')[0],
              videoUrl: newsItem.videoUrl || '',
            };
            reset(formattedNews);
        } else {
            reset({
                id: undefined,
                title: '',
                snippet: '',
                content: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                imageUrl: 'https://placehold.co/300x200.png',
                videoUrl: '',
                link: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta notícia?")) return;

        await deleteNewsItemMutation.mutateAsync(id, {
            onSuccess: () => toast({ title: "Sucesso!", description: "Notícia excluída." }),
            onError: (error) => toast({ title: "Falha na Exclusão", description: error.message, variant: "destructive" }),
        });
    };
    
    const onSubmit = async (data: NewsFormValues) => {
        try {
            if (editingNews) {
                await updateNewsItem({ ...editingNews, ...data, videoUrl: data.videoUrl || undefined });
                toast({ title: "Notícia atualizada com sucesso." });
            } else {
                await addNewsItem({ ...data, isHighlight: false, highlightType: 'small', videoUrl: data.videoUrl || undefined });
                toast({ title: "Notícia adicionada com sucesso." });
            }
            setIsDialogOpen(false);
            setEditingNews(null);
        } catch (error) {
             toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível salvar a notícia.",
                variant: "destructive"
            });
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Notícias</CardTitle>
                    <CardDescription>Adicione, edite ou remova notícias do feed. Marque até 3 para destaque.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)} className="bg-admin-primary hover:bg-admin-primary/90">
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
                                <TableHead>Destaque</TableHead>
                                <TableHead>Tipo de Destaque</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {newsItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={item.isHighlight}
                                            onCheckedChange={() => toggleNewsHighlight(item.id)}
                                            aria-label="Marcar como destaque"
                                        />
                                    </TableCell>
                                     <TableCell>
                                        {item.isHighlight && (
                                             <Select
                                                defaultValue={item.highlightType || 'small'}
                                                onValueChange={(value) => updateHighlightType(item.id, value as 'large' | 'small')}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="small">Pequeno</SelectItem>
                                                    <SelectItem value="large">Grande</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)} className="hover:bg-muted">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-muted" disabled={deleteNewsItemMutation.isPending && deleteNewsItemMutation.variables === item.id}>
                                            {deleteNewsItemMutation.isPending && deleteNewsItemMutation.variables === item.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingNews(null); setIsDialogOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                   <ScrollArea className="max-h-[80vh]">
                     <div className="p-6 pt-0">
                        <DialogHeader>
                            <DialogTitle>{editingNews ? 'Editar Notícia' : 'Adicionar Notícia'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div>
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" {...register('title')} disabled={isFormSubmitting}/>
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="snippet">Snippet (texto curto para o card)</Label>
                                <Textarea id="snippet" {...register('snippet')} disabled={isFormSubmitting} rows={3}/>
                                {errors.snippet && <p className="text-sm text-destructive mt-1">{errors.snippet.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="content">Conteúdo Completo (para o modal)</Label>
                                <Textarea id="content" {...register('content')} disabled={isFormSubmitting} rows={7}/>
                                {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="category">Categoria</Label>
                                <Input id="category" {...register('category')} disabled={isFormSubmitting}/>
                                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="date">Data</Label>
                                <Input id="date" type="date" {...register('date')} disabled={isFormSubmitting}/>
                                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="imageUrl">URL da Imagem</Label>
                                <Input id="imageUrl" {...register('imageUrl')} placeholder="https://placehold.co/300x200.png" disabled={isFormSubmitting}/>
                                <p className="text-xs text-muted-foreground mt-1">Este campo é usado como fallback se nenhuma URL de vídeo for fornecida.</p>
                                {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="videoUrl">URL do Vídeo (Opcional)</Label>
                                <Input id="videoUrl" {...register('videoUrl')} placeholder="https://storage.googleapis.com/.../video.mp4" disabled={isFormSubmitting}/>
                                <p className="text-xs text-muted-foreground mt-1">Se preenchido, o vídeo será exibido em vez da imagem.</p>
                                {errors.videoUrl && <p className="text-sm text-destructive mt-1">{errors.videoUrl.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="link">URL do Link (opcional)</Label>
                                <Input id="link" {...register('link')} placeholder="https://..." disabled={isFormSubmitting}/>
                                {errors.link && <p className="text-sm text-destructive mt-1">{errors.link.message}</p>}
                            </div>
                            
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={isFormSubmitting}>Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isFormSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                                    {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </form>
                      </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
