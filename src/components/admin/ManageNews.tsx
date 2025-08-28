
"use client";
import React, { useState, useEffect } from 'react';
import { useNews } from '@/contexts/NewsContext';
import type { NewsItemType, NewsStatus } from '@/contexts/NewsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Star, Eye, Link as LinkIcon, UploadCloud, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/firestore-service';

const newsSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    snippet: z.string().min(10, "Snippet deve ter no mínimo 10 caracteres"),
    content: z.string().min(10, "Conteúdo completo deve ter no mínimo 10 caracteres"),
    category: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    link: z.string().url("URL inválida").optional().or(z.literal('')),
});

type NewsFormValues = z.infer<typeof newsSchema>;

const statusConfig: { [key in NewsStatus]: { label: string, color: string } } = {
  draft: { label: 'Rascunho', color: 'bg-yellow-500' },
  approved: { label: 'Aprovado', color: 'bg-blue-500' },
  published: { label: 'Publicado', color: 'bg-green-500' },
};

const STORAGE_PATH_NEWS = "Destaques e notícias";

export function ManageNews() {
    const { newsItems, addNewsItem, updateNewsItem, deleteNewsItemMutation, toggleNewsHighlight, updateHighlightType, updateNewsStatus } = useNews();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItemType | null>(null);
    const [previewingNews, setPreviewingNews] = useState<NewsItemType | null>(null);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema),
    });
    
    const handleOrderChange = async (newsId: string, newOrder: number) => {
        try {
            await updateNewsItem({ id: newsId, order: newOrder });
            toast({ title: "Ordem atualizada", description: "A nova ordem da notícia foi salva." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível atualizar a ordem.", variant: "destructive" });
        }
    };

    const handleDialogOpen = (newsItem: NewsItemType | null) => {
        setEditingNews(newsItem);
        setImageFile(null);
        setVideoFile(null);
        if (newsItem) {
            const formattedNews = {
              ...newsItem,
              date: new Date(newsItem.date).toISOString().split('T')[0],
              link: newsItem.link || '',
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
                link: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handlePreviewOpen = (newsItem: NewsItemType) => {
        setPreviewingNews(newsItem);
        setIsPreviewOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta notícia?")) return;

        await deleteNewsItemMutation.mutateAsync(id, {
            onSuccess: () => toast({ title: "Sucesso!", description: "Notícia excluída." }),
            onError: (error) => toast({ title: "Falha na Exclusão", description: error.message, variant: "destructive" }),
        });
    };
    
    const onSubmit = async (data: NewsFormValues) => {
        setIsSubmitting(true);
        try {
            let imageUrl = editingNews?.imageUrl || '';
            let videoUrl = editingNews?.videoUrl || '';

            if (!editingNews && !imageFile) {
                toast({ title: "Erro de Validação", description: "A imagem principal é obrigatória para uma nova notícia.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }
            
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, STORAGE_PATH_NEWS);
            }
            if (videoFile) {
                videoUrl = await uploadFile(videoFile, STORAGE_PATH_NEWS);
            }

            const submissionData = { ...data, imageUrl, videoUrl: videoUrl || undefined };

            if (editingNews) {
                await updateNewsItem({ id: editingNews.id, ...submissionData });
                toast({ title: "Notícia atualizada com sucesso." });
            } else {
                await addNewsItem({ ...submissionData, isHighlight: false, highlightType: 'small', order: 0 });
                toast({ title: "Notícia criada como rascunho." });
            }
            setIsDialogOpen(false);
        } catch (error) {
             toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível salvar a notícia.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <>
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
                                    <TableHead className="w-[100px]">Ordem</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Destaque</TableHead>
                                    <TableHead>Tipo de Destaque</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {newsItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                              type="number"
                                              defaultValue={item.order}
                                              onBlur={(e) => handleOrderChange(item.id, parseInt(e.target.value, 10))}
                                              className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>
                                            <Select
                                              value={item.status}
                                              onValueChange={(value) => updateNewsStatus(item.id, value as NewsStatus)}
                                            >
                                                <SelectTrigger className="w-[130px]">
                                                    <SelectValue>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusConfig[item.status].color)} />
                                                            {statusConfig[item.status].label}
                                                        </div>
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(statusConfig).map(([key, config]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", config.color)} />
                                                                {config.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
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
                                            <Button variant="ghost" size="icon" onClick={() => handlePreviewOpen(item)} className="hover:bg-muted" title="Visualizar">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)} className="hover:bg-muted" title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-muted" disabled={deleteNewsItemMutation.isPending && deleteNewsItemMutation.variables === item.id} title="Excluir">
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
            </Card>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent className="max-w-2xl">
                {previewingNews && (
                  <>
                    <DialogHeader>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4 bg-black">
                          {previewingNews.videoUrl ? (
                              <video src={previewingNews.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                          ) : (
                              <Image
                                  src={previewingNews.imageUrl}
                                  alt={previewingNews.title}
                                  layout="fill"
                                  objectFit="cover"
                              />
                          )}
                      </div>
                      <DialogTitle className="font-headline text-2xl text-left">{previewingNews.title}</DialogTitle>
                      <div className="text-left !mt-2">
                          <Badge variant="outline" className="font-body text-foreground">{previewingNews.category}</Badge>
                          <span className="text-xs text-muted-foreground font-body ml-2">
                              {new Date(previewingNews.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                      </div>
                    </DialogHeader>
                    <ScrollArea className="max-h-[40vh] pr-4">
                      <div className="py-4 text-sm text-foreground">
                        {previewingNews.content && <p className="whitespace-pre-wrap">{previewingNews.content}</p>}
                        {previewingNews.link && (
                          <div className="mt-4">
                            <Button variant="outline" asChild>
                              <a href={previewingNews.link} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Acessar Link
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="hover:bg-muted">Fechar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

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
                                <Input id="title" {...register('title')} disabled={isSubmitting}/>
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="snippet">Snippet (texto curto para o card)</Label>
                                <Textarea id="snippet" {...register('snippet')} disabled={isSubmitting} rows={3}/>
                                {errors.snippet && <p className="text-sm text-destructive mt-1">{errors.snippet.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="content">Conteúdo Completo (para o modal)</Label>
                                <Textarea id="content" {...register('content')} disabled={isSubmitting} rows={7}/>
                                {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="category">Categoria</Label>
                                <Input id="category" {...register('category')} disabled={isSubmitting}/>
                                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="date">Data</Label>
                                <Input id="date" type="date" {...register('date')} disabled={isSubmitting}/>
                                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="imageUrl">Imagem Principal {editingNews ? '(Opcional: substituir)' : '*'}</Label>
                                <Input
                                    id="imageUrl"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                    disabled={isSubmitting}
                                />
                                {imageFile && <p className="text-xs text-muted-foreground mt-1">Nova imagem: {imageFile.name}</p>}
                                {!imageFile && editingNews?.imageUrl && <p className="text-xs text-muted-foreground mt-1">Imagem atual: <a href={editingNews.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver Imagem</a></p>}
                            </div>
                            <div>
                                <Label htmlFor="videoUrl">Vídeo (Opcional)</Label>
                                <Input
                                    id="videoUrl"
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                                    disabled={isSubmitting}
                                />
                                {videoFile && <p className="text-xs text-muted-foreground mt-1">Novo vídeo: {videoFile.name}</p>}
                                {!videoFile && editingNews?.videoUrl && <p className="text-xs text-muted-foreground mt-1">Vídeo atual: <a href={editingNews.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver Vídeo</a></p>}
                            </div>
                            <div>
                                <Label htmlFor="link">URL do Link (opcional)</Label>
                                <Input id="link" {...register('link')} placeholder="https://..." disabled={isSubmitting}/>
                                {errors.link && <p className="text-sm text-destructive mt-1">{errors.link.message}</p>}
                            </div>
                            
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </form>
                      </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
