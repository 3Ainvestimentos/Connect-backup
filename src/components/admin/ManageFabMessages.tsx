"use client";

import React, { useState, useMemo } from 'react';
import { useFabMessages, type FabMessageType, fabMessageSchema } from '@/contexts/FabMessagesContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Award, Users, Send, Eye, MessageSquare, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { Badge } from '../ui/badge';
import { getIcon, iconList } from '@/lib/icon-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';

type FabMessageFormValues = z.infer<typeof fabMessageSchema>;

export function ManageFabMessages() {
    const { fabMessages, addFabMessage, updateFabMessage, deleteFabMessageMutation, loading } = useFabMessages();
    const { collaborators } = useCollaborators();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<FabMessageType | null>(null);

    const form = useForm<FabMessageFormValues>({
        resolver: zodResolver(fabMessageSchema),
        defaultValues: {
            title: '',
            content: '',
            icon: 'MessageSquare',
            ctaLink: '',
            ctaText: '',
            targetUserIds: ['all'],
            status: 'draft',
            createdAt: new Date().toISOString(),
        }
    });

    const { formState: { isSubmitting, errors }, watch } = form;
    const watchRecipientIds = watch('targetUserIds');
    const watchIcon = watch('icon');

    const handleDialogOpen = (message: FabMessageType | null) => {
        setEditingMessage(message);
        if (message) {
            form.reset(message);
        } else {
            form.reset({
                 title: '',
                content: '',
                icon: 'MessageSquare',
                ctaLink: '',
                ctaText: '',
                targetUserIds: ['all'],
                status: 'draft',
                createdAt: new Date().toISOString(),
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta mensagem? Esta ação é irreversível.")) return;
        try {
            await deleteFabMessageMutation.mutateAsync(id);
            toast({ title: "Sucesso!", description: "Mensagem FAB excluída." });
        } catch (error) {
            toast({ title: "Falha na Exclusão", description: (error as Error).message, variant: "destructive" });
        }
    };

    const onSubmit = async (data: FabMessageFormValues) => {
        const payload = { ...data, status: 'sent' as const };
        try {
            if (editingMessage) {
                await updateFabMessage({ ...payload, id: editingMessage.id });
                toast({ title: "Mensagem FAB atualizada com sucesso." });
            } else {
                await addFabMessage(payload);
                toast({ title: "Mensagem FAB enviada com sucesso." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
        }
    };

    const getRecipientDescription = (ids: string[]) => {
        if (ids.includes('all')) return `Todos os ${collaborators.length} Colaboradores`;
        return `${ids.length} colaborador(es) selecionado(s)`;
    };
    
    const calculateEngagement = (message: FabMessageType) => {
        const totalTargets = message.targetUserIds.includes('all') ? collaborators.length : message.targetUserIds.length;
        if (totalTargets === 0) return { readPercentage: 0, clickPercentage: 0 };
        
        const readPercentage = (message.readByUserIds.length / totalTargets) * 100;
        const clickPercentage = (message.clickedByUserIds.length / totalTargets) * 100;
        
        return { readPercentage, clickPercentage };
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gerenciar Mensagens FAB</CardTitle>
                        <CardDescription>Crie, envie e monitore o engajamento das mensagens flutuantes.</CardDescription>
                    </div>
                    <Button onClick={() => handleDialogOpen(null)} className="bg-admin-primary hover:bg-admin-primary/90">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Mensagem FAB
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Público-Alvo</TableHead>
                                    <TableHead>Leituras</TableHead>
                                    <TableHead>Cliques</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fabMessages.map(item => {
                                    const { readPercentage, clickPercentage } = calculateEngagement(item);
                                    return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell><Badge variant="outline">{getRecipientDescription(item.targetUserIds)}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={readPercentage} className="w-24 h-2 [&>div]:bg-blue-500"/>
                                                <span className="text-xs font-mono text-muted-foreground">{readPercentage.toFixed(0)}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <Progress value={clickPercentage} className="w-24 h-2 [&>div]:bg-success"/>
                                                <span className="text-xs font-mono text-muted-foreground">{clickPercentage.toFixed(0)}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)} className="hover:bg-muted">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={deleteFabMessageMutation.isPending && deleteFabMessageMutation.variables === item.id} className="hover:bg-muted">
                                                {deleteFabMessageMutation.isPending && deleteFabMessageMutation.variables === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <ScrollArea className="max-h-[80vh] pr-6 -mr-6">
                        <div className="pr-1">
                            <DialogHeader>
                                <DialogTitle>{editingMessage ? 'Editar Mensagem FAB' : 'Nova Mensagem FAB'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                                <div>
                                    <Label htmlFor="title">Título (Chamada principal)</Label>
                                    <Input id="title" {...form.register('title')} />
                                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="content">Conteúdo (Texto do balão)</Label>
                                    <Textarea id="content" {...form.register('content')} />
                                    {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="icon">Ícone</Label>
                                    <Controller name="icon" control={form.control} render={({ field }) => {
                                        const IconToShow = getIcon(field.value);
                                        return (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue>
                                                    <div className="flex items-center gap-2"><IconToShow className='h-4 w-4' /><span>{field.value}</span></div>
                                                </SelectValue></SelectTrigger>
                                                <SelectContent><ScrollArea className="h-60">
                                                    {iconList.map(iconName => {
                                                        const Icon = getIcon(iconName);
                                                        return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{iconName}</span></div></SelectItem>
                                                    })}
                                                </ScrollArea></SelectContent>
                                            </Select>
                                        );
                                    }}/>
                                    {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ctaText">Texto do Botão (CTA)</Label>
                                        <Input id="ctaText" {...form.register('ctaText')} placeholder="Ex: Ver agora" />
                                        {errors.ctaText && <p className="text-sm text-destructive mt-1">{errors.ctaText.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="ctaLink">Link do Botão (CTA)</Label>
                                        <Input id="ctaLink" {...form.register('ctaLink')} placeholder="https://..." />
                                        {errors.ctaLink && <p className="text-sm text-destructive mt-1">{errors.ctaLink.message}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>Público-Alvo</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-left mt-2" onClick={() => setIsSelectionModalOpen(true)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>{getRecipientDescription(watchRecipientIds)}</span>
                                    </Button>
                                    {errors.targetUserIds && <p className="text-sm text-destructive mt-1">{errors.targetUserIds.message as string}</p>}
                                </div>
                                <DialogFooter className="pt-4">
                                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                                    <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingMessage ? 'Salvar Alterações e Reenviar' : 'Enviar Mensagem'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

             <RecipientSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                allCollaborators={collaborators}
                selectedIds={watchRecipientIds}
                onConfirm={(newIds) => {
                    form.setValue('targetUserIds', newIds, { shouldValidate: true });
                    setIsSelectionModalOpen(false);
                }}
            />
        </>
    );
}
