
"use client";

import React, { useState, useMemo } from 'react';
import { useFabMessages, type FabMessageType, type FabMessagePayload } from '@/contexts/FabMessagesContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Send, MessageSquare, Edit2, Play, Pause, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '../ui/badge';
import { getIcon, iconList } from '@/lib/icon-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';


const ctaMessageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
  ctaText: z.string().min(1, "Texto do botão é obrigatório."),
  ctaLink: z.string().url("Link deve ser uma URL válida."),
});

const followUpMessageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório."),
  content: z.string().min(1, "Conteúdo é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
});

const formSchema = z.object({
    ctaMessage: ctaMessageSchema,
    followUpMessage: followUpMessageSchema,
});

type FabMessageFormValues = z.infer<typeof formSchema>;

const StatusBadge = ({ status }: { status: FabMessageType['status'] | 'not_created' }) => {
    const config = {
        not_created: { label: 'Não Criada', className: 'bg-gray-100 text-gray-800' },
        draft: { label: 'Rascunho', className: 'bg-yellow-100 text-yellow-800' },
        sent: { label: 'Enviada', className: 'bg-blue-100 text-blue-800' },
        clicked: { label: 'Clicada', className: 'bg-green-100 text-green-800' },
    }[status];

    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};


export function ManageFabMessages() {
    const { fabMessages, upsertMessageForUser, deleteMessageForUser, updateMessageStatus, loading } = useFabMessages();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);

    const commercialUsers = useMemo(() => {
        return collaborators.filter(c => c.axis === 'Comercial');
    }, [collaborators]);

    const userMessageMap = useMemo(() => {
        const map = new Map<string, FabMessageType>();
        fabMessages.forEach(msg => map.set(msg.userId, msg));
        return map;
    }, [fabMessages]);

    const form = useForm<FabMessageFormValues>({
        resolver: zodResolver(formSchema),
    });
    
    const { formState: { isSubmitting }, reset, handleSubmit, control } = form;

    const handleOpenForm = (user: Collaborator) => {
        setEditingUser(user);
        const existingMessage = userMessageMap.get(user.id3a);
        if (existingMessage) {
            reset({
                ctaMessage: existingMessage.ctaMessage,
                followUpMessage: existingMessage.followUpMessage,
            });
        } else {
             reset({
                ctaMessage: { title: '', icon: 'MessageSquare', ctaText: '', ctaLink: '' },
                followUpMessage: { title: '', content: '', icon: 'CheckCircle' },
            });
        }
        setIsFormOpen(true);
    };

    const onSubmit = async (data: FabMessageFormValues) => {
        if (!editingUser) return;
        
        const payload: FabMessagePayload = {
            userId: editingUser.id3a,
            userName: editingUser.name,
            status: 'draft',
            isActive: true,
            createdAt: userMessageMap.get(editingUser.id3a)?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
        };

        try {
            await upsertMessageForUser(editingUser.id3a, payload);
            toast({ title: "Sucesso", description: `Mensagens para ${editingUser.name} foram salvas como rascunho.` });
            setIsFormOpen(false);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as mensagens.", variant: "destructive" });
        }
    };
    
    const handleSendMessage = async () => {
        if (!editingUser) return;
        // First, save the current form state
        await handleSubmit(onSubmit)(); 
        
        // Then, update the status to 'sent'
        await updateMessageStatus(editingUser.id3a, 'sent', true);
        toast({ title: "Mensagem Enviada!", description: `A campanha foi ativada para ${editingUser.name}.`, variant: 'success' });
        setIsFormOpen(false);
    };

    const handleToggleActivation = async (user: Collaborator, isActive: boolean) => {
        const message = userMessageMap.get(user.id3a);
        if (!message) {
            toast({ title: "Atenção", description: "Crie uma mensagem primeiro antes de ativá-la.", variant: "destructive" });
            return;
        }
        try {
            await updateMessageStatus(user.id3a, message.status, isActive);
            toast({ title: "Sucesso", description: `Campanha ${isActive ? 'ativada' : 'pausada'} para ${user.name}.`, variant: 'default' });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível alterar o status da campanha.", variant: "destructive" });
        }
    };
    
    const handleDelete = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja apagar a configuração de mensagens para este usuário? Esta ação é irreversível.")) return;
        try {
             await deleteMessageForUser(userId);
             toast({ title: "Sucesso!", description: "Configuração de mensagens removida." });
        } catch (error) {
             toast({ title: "Erro", description: "Não foi possível remover a configuração.", variant: "destructive" });
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Mensagens por Colaborador</CardTitle>
                <CardDescription>Configure e envie campanhas de mensagens individuais para os colaboradores do eixo Comercial.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Status da Campanha</TableHead>
                                <TableHead>Ativa</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commercialUsers.map(user => {
                                const message = userMessageMap.get(user.id3a);
                                return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={message?.status || 'not_created'} />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                          checked={message?.isActive ?? false}
                                          onCheckedChange={(checked) => handleToggleActivation(user, checked)}
                                          disabled={!message}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenForm(user)}>
                                            <Edit2 className="mr-2 h-4 w-4"/> Gerenciar
                                        </Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id3a)} disabled={!message}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <ScrollArea className="max-h-[80vh] p-1">
                        <div className="p-6 pt-0">
                        <DialogHeader>
                            <DialogTitle>Configurar Mensagens para</DialogTitle>
                            <DialogDescription>{editingUser?.name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                            {/* CTA Message Section */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-semibold text-lg">1. Mensagem de CTA (Primeiro Contato)</h3>
                                <div>
                                    <Label htmlFor="cta.title">Título</Label>
                                    <Input id="cta.title" {...form.register('ctaMessage.title')} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="cta.icon">Ícone</Label>
                                         <Controller name="ctaMessage.icon" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><ScrollArea className="h-60">
                                                    {iconList.map(i => <SelectItem key={i} value={i}><div className="flex items-center gap-2">{React.createElement(getIcon(i), {className:"h-4 w-4"})}<span>{i}</span></div></SelectItem>)}
                                                </ScrollArea></SelectContent>
                                            </Select>
                                        )}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="cta.ctaText">Texto do Botão</Label>
                                        <Input id="cta.ctaText" {...form.register('ctaMessage.ctaText')} />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="cta.ctaLink">Link do Botão</Label>
                                    <Input id="cta.ctaLink" {...form.register('ctaMessage.ctaLink')} />
                                </div>
                            </div>
                            
                            {/* Follow-up Message Section */}
                             <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-semibold text-lg">2. Mensagem de Acompanhamento (Pós-clique)</h3>
                                <div>
                                    <Label htmlFor="followup.title">Título</Label>
                                    <Input id="followup.title" {...form.register('followUpMessage.title')} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="followup.icon">Ícone</Label>
                                        <Controller name="followUpMessage.icon" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><ScrollArea className="h-60">
                                                    {iconList.map(i => <SelectItem key={i} value={i}><div className="flex items-center gap-2">{React.createElement(getIcon(i), {className:"h-4 w-4"})}<span>{i}</span></div></SelectItem>)}
                                                </ScrollArea></SelectContent>
                                            </Select>
                                        )}/>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="followup.content">Conteúdo</Label>
                                    <Textarea id="followup.content" {...form.register('followUpMessage.content')} />
                                </div>
                            </div>
                        </form>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="!justify-between">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                        </DialogClose>
                        <div className="flex gap-2">
                             <Button type="button" variant="secondary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Salvar Rascunho
                            </Button>
                            <Button type="button" className="bg-admin-primary hover:bg-admin-primary/90" onClick={handleSendMessage} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                Salvar e Enviar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}


    