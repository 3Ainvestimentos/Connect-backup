"use client";
import React, { useState } from 'react';
import { useMessages } from '@/contexts/MessagesContext';
import type { MessageType } from '@/contexts/MessagesContext';
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
import { ScrollArea } from '../ui/scroll-area';

const messageSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    content: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
    sender: z.string().min(1, "Remetente é obrigatório"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export function ManageMessages() {
    const { messages, addMessage, updateMessage, deleteMessage } = useMessages();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormValues>({
        resolver: zodResolver(messageSchema),
    });

    const handleDialogOpen = (message: MessageType | null) => {
        setEditingMessage(message);
        if (message) {
            const formattedMessage = {
              ...message,
              date: new Date(message.date).toISOString().split('T')[0],
            };
            reset(formattedMessage);
        } else {
            reset({
                id: undefined,
                title: '',
                content: '',
                sender: '',
                date: new Date().toISOString().split('T')[0],
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
            updateMessage({ ...editingMessage, ...data });
            toast({ title: "Mensagem atualizada com sucesso." });
        } else {
            addMessage(data as Omit<MessageType, 'id'>);
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
                                <TableHead>Remetente</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {messages.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.sender}</TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
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

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingMessage(null); setIsDialogOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingMessage ? 'Editar Mensagem' : 'Adicionar Mensagem'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea id="content" {...register('content')} rows={5} />
                            {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="sender">Remetente</Label>
                                <Input id="sender" {...register('sender')} />
                                {errors.sender && <p className="text-sm text-destructive mt-1">{errors.sender.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="date">Data</Label>
                                <Input id="date" type="date" {...register('date')} />
                                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
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
