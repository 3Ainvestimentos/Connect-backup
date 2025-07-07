
"use client";
import React, { useState, useMemo } from 'react';
import { useMessages, type MessageType } from '@/contexts/MessagesContext';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const messageSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    content: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
    sender: z.string().min(1, "Remetente é obrigatório"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    target: z.object({
        type: z.enum(['all', 'axis', 'area', 'city']),
        value: z.string().min(1, "O valor do alvo é obrigatório."),
    }),
});

type MessageFormValues = z.infer<typeof messageSchema>;

const ReadStatusDialog = ({ message, recipients }: { message: MessageType; recipients: Collaborator[] }) => {
    const readCollaborators = recipients.filter(r => message.readBy.includes(r.id));
    const unreadCollaborators = recipients.filter(r => !message.readBy.includes(r.id));

    return (
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
                <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};


export function ManageMessages() {
    const { messages, addMessage, updateMessage, deleteMessage, getMessageRecipients } = useMessages();
    const { collaborators } = useCollaborators();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);

    const uniqueSegments = useMemo(() => ({
        axis: [...new Set(collaborators.map(c => c.axis))],
        area: [...new Set(collaborators.map(c => c.area))],
        city: [...new Set(collaborators.map(c => c.city))],
    }), [collaborators]);

    const form = useForm<MessageFormValues>({
        resolver: zodResolver(messageSchema),
        defaultValues: { target: { type: 'all', value: 'all' } }
    });

    const watchTargetType = form.watch('target.type');

    React.useEffect(() => {
        if(watchTargetType === 'all') {
            form.setValue('target.value', 'all');
        } else {
            form.setValue('target.value', '');
        }
    }, [watchTargetType, form]);


    const handleDialogOpen = (message: MessageType | null) => {
        setEditingMessage(message);
        if (message) {
            const formattedMessage = { ...message, date: new Date(message.date).toISOString().split('T')[0] };
            form.reset(formattedMessage);
        } else {
            form.reset({
                id: undefined,
                title: '',
                content: '',
                sender: 'Admin',
                date: new Date().toISOString().split('T')[0],
                target: { type: 'all', value: 'all' }
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta mensagem?")) {
            deleteMessage(id);
            toast({ title: "Mensagem excluída com sucesso." });
        }
    };
    
    const onSubmit = (data: MessageFormValues) => {
        if (editingMessage) {
            // readBy is not in form, so we preserve it from the original message
            updateMessage({ ...data, id: editingMessage.id, readBy: editingMessage.readBy });
            toast({ title: "Mensagem atualizada com sucesso." });
        } else {
            const { id, ...dataWithoutId } = data;
            addMessage(dataWithoutId);
            toast({ title: "Mensagem adicionada com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingMessage(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Mensagens</CardTitle>
                    <CardDescription>Adicione, edite ou remova mensagens do mural.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
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
                                            {item.target.type === 'all' ? 'Todos' : `${item.target.type.charAt(0).toUpperCase() + item.target.type.slice(1)}: ${item.target.value}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="link" className="p-0 h-auto" disabled={totalRecipients === 0}>
                                                    {readCount} / {totalRecipients}
                                                </Button>
                                            </DialogTrigger>
                                            <ReadStatusDialog message={item} recipients={recipients} />
                                        </Dialog>
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
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingMessage(null); setIsDialogOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingMessage ? 'Editar Mensagem' : 'Adicionar Mensagem'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea id="content" {...form.register('content')} rows={5} />
                            {form.formState.errors.content && <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="sender">Remetente</Label>
                                <Input id="sender" {...form.register('sender')} />
                                {form.formState.errors.sender && <p className="text-sm text-destructive mt-1">{form.formState.errors.sender.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="date">Data</Label>
                                <Input id="date" type="date" {...form.register('date')} />
                                {form.formState.errors.date && <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>}
                            </div>
                        </div>

                        <Separator />
                        <Label>Segmento de Destinatários</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor="target-type">Enviar para</Label>
                                <Controller
                                    name="target.type"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger id="target-type"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os Colaboradores</SelectItem>
                                                <SelectItem value="axis">Por Eixo</SelectItem>
                                                <SelectItem value="area">Por Área</SelectItem>
                                                <SelectItem value="city">Por Cidade</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            {watchTargetType !== 'all' && (
                            <div>
                                <Label htmlFor="target-value">Segmento Específico</Label>
                                <Controller
                                    name="target.value"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="target-value"><SelectValue placeholder={`Selecione um(a) ${watchTargetType}`} /></SelectTrigger>
                                            <SelectContent>
                                                {uniqueSegments[watchTargetType]?.map(segment => (
                                                    <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {form.formState.errors.target?.value && <p className="text-sm text-destructive mt-1">{form.formState.errors.target.value.message}</p>}
                            </div>
                            )}
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

    