
"use client";
import React, { useState, useMemo } from 'react';
import { useMessages, type MessageType } from '@/contexts/MessagesContext';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { RecipientSelectionModal } from './RecipientSelectionModal';

const messageSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    content: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
    sender: z.string().min(1, "Remetente é obrigatório"),
    link: z.string().url("URL inválida").optional().or(z.literal('')),
    mediaUrl: z.string().url("URL inválida").optional().or(z.literal('')),
    recipientIds: z.array(z.string()).min(1, "Selecione ao menos um destinatário."),
});

type MessageFormValues = z.infer<typeof messageSchema>;

const ReadStatusDialog = ({ message, recipients, onOpenChange }: { message: MessageType | null; recipients: Collaborator[]; onOpenChange: (open: boolean) => void; }) => {
    if (!message) return null;

    const readCollaborators = recipients.filter(r => message.readBy.includes(r.id));
    const unreadCollaborators = recipients.filter(r => !message.readBy.includes(r.id));

    return (
        <Dialog open={!!message} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Status de Leitura</DialogTitle>
                    <DialogDescription>"{message.title}"</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Lido ({readCollaborators.length})</h4>
                        <ScrollArea className="h-64">
                            <ul className="space-y-1 text-sm pr-4">
                                {readCollaborators.map(c => <li key={c.id} className="truncate">{c.name}</li>)}
                            </ul>
                        </ScrollArea>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" /> Não Lido ({unreadCollaborators.length})</h4>
                         <ScrollArea className="h-64">
                            <ul className="space-y-1 text-sm pr-4">
                                {unreadCollaborators.map(c => <li key={c.id} className="truncate">{c.name}</li>)}
                            </ul>
                        </ScrollArea>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export function ManageMessages() {
    const { messages, addMessage, updateMessage, deleteMessageMutation, getMessageRecipients } = useMessages();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
    const [viewingStatusFor, setViewingStatusFor] = useState<MessageType | null>(null);
    
    const form = useForm<MessageFormValues>({
        resolver: zodResolver(messageSchema),
        defaultValues: { recipientIds: ['all'] }
    });

    const watchRecipientIds = form.watch('recipientIds');

    const handleDialogOpen = (message: MessageType | null) => {
        setEditingMessage(message);
        if (message) {
            form.reset({
                ...message,
                link: message.link || '',
                mediaUrl: message.mediaUrl || '',
            });
        } else {
            form.reset({
                id: undefined,
                title: '',
                content: '',
                sender: 'Admin',
                link: '',
                mediaUrl: '',
                recipientIds: ['all'],
            });
        }
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.")) {
            deleteMessageMutation.mutate(id);
        }
    };
    
    const onSubmit = async (data: MessageFormValues) => {
        const submissionData = { ...data, date: new Date().toISOString() };

        try {
            if (editingMessage) {
                const updatedMessage: MessageType = {
                    ...editingMessage,
                    ...submissionData,
                };
                await updateMessage(updatedMessage);
                toast({ title: "Mensagem atualizada com sucesso." });
            } else {
                await addMessage(submissionData);
                toast({ title: "Mensagem adicionada com sucesso." });
            }
            setIsFormOpen(false);
            setEditingMessage(null);
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível enviar a mensagem.",
                variant: "destructive"
            });
        }
    };
    
    const getRecipientDescription = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Nenhum destinatário';
        if (ids.includes('all')) return 'Todos os Colaboradores';
        return `${ids.length} colaborador(es) selecionado(s)`;
    }

    const viewingStatusRecipients = useMemo(() => {
        if (!viewingStatusFor) return [];
        return getMessageRecipients(viewingStatusFor, collaborators);
    }, [viewingStatusFor, getMessageRecipients, collaborators]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Mensagens</CardTitle>
                    <CardDescription>Adicione, edite ou remova mensagens do mural.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)} className="bg-admin-primary hover:bg-admin-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Mensagem
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Destinatários</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Leituras</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {messages.map(item => {
                                const recipients = getMessageRecipients(item, collaborators);
                                const totalRecipients = recipients.length;
                                const readCount = item.readBy.length;
                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {getRecipientDescription(item.recipientIds)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="link" 
                                            className="p-0 h-auto" 
                                            disabled={totalRecipients === 0}
                                            onClick={() => setViewingStatusFor(item)}
                                        >
                                            {readCount} / {totalRecipients}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)} className="hover:bg-muted">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-muted" disabled={deleteMessageMutation.isPending}>
                                             {deleteMessageMutation.isPending && deleteMessageMutation.variables === item.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingMessage(null); setIsFormOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingMessage ? 'Editar Mensagem' : 'Adicionar Mensagem'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" {...form.register('title')} disabled={form.formState.isSubmitting}/>
                            {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea id="content" {...form.register('content')} rows={5} disabled={form.formState.isSubmitting}/>
                            {form.formState.errors.content && <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="sender">Remetente</Label>
                            <Input id="sender" {...form.register('sender')} disabled={form.formState.isSubmitting}/>
                            {form.formState.errors.sender && <p className="text-sm text-destructive mt-1">{form.formState.errors.sender.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="mediaUrl">URL da Mídia (Imagem/Vídeo - opcional)</Label>
                            <Input id="mediaUrl" {...form.register('mediaUrl')} placeholder="https://..." disabled={form.formState.isSubmitting}/>
                            {form.formState.errors.mediaUrl && <p className="text-sm text-destructive mt-1">{form.formState.errors.mediaUrl.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="link">URL do Link (opcional)</Label>
                            <Input id="link" {...form.register('link')} placeholder="https://..." disabled={form.formState.isSubmitting}/>
                            {form.formState.errors.link && <p className="text-sm text-destructive mt-1">{form.formState.errors.link.message}</p>}
                        </div>

                        <Separator />
                        <div>
                            <Label>Destinatários</Label>
                            <Button type="button" variant="outline" className="w-full justify-start text-left mt-2" onClick={() => setIsSelectionModalOpen(true)}>
                               <Users className="mr-2 h-4 w-4" />
                               <span>{getRecipientDescription(watchRecipientIds)}</span>
                            </Button>
                            {form.formState.errors.recipientIds && <p className="text-sm text-destructive mt-1">{form.formState.errors.recipientIds.message}</p>}
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={form.formState.isSubmitting}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-admin-primary hover:bg-admin-primary/90">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
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
                    form.setValue('recipientIds', newIds, { shouldValidate: true });
                    setIsSelectionModalOpen(false);
                }}
            />
             <ReadStatusDialog 
                message={viewingStatusFor}
                recipients={viewingStatusRecipients}
                onOpenChange={(isOpen) => !isOpen && setViewingStatusFor(null)}
            />
        </Card>
    );
}
