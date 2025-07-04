"use client";
import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import type { EventType } from '@/contexts/EventsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { iconList, getIcon } from '@/lib/icons';

const eventSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    time: z.string().min(1, "Horário é obrigatório"),
    icon: z.string().min(1, "Ícone é obrigatório"),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function ManageEvents() {
    const { events, addEvent, updateEvent, deleteEvent } = useEvents();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
    });

    const handleDialogOpen = (event: EventType | null) => {
        setEditingEvent(event);
        if (event) {
            form.reset(event);
        } else {
            form.reset({
                id: undefined,
                title: '',
                time: '',
                icon: 'CalendarDays',
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este evento?")) {
            deleteEvent(id);
            toast({ title: "Evento excluído com sucesso." });
        }
    };
    
    const onSubmit = (data: EventFormValues) => {
        if (editingEvent) {
            updateEvent({ ...editingEvent, ...data });
            toast({ title: "Evento atualizado com sucesso." });
        } else {
            addEvent(data as Omit<EventType, 'id'>);
            toast({ title: "Evento adicionado com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingEvent(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Eventos</CardTitle>
                    <CardDescription>Adicione, edite ou remova eventos do calendário.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Evento
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ícone</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Horário</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map(item => {
                                const Icon = getIcon(item.icon);
                                return (
                                <TableRow key={item.id}>
                                    <TableCell><Icon className="h-5 w-5 text-muted-foreground" /></TableCell>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.time}</TableCell>
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

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingEvent(null); setIsDialogOpen(isOpen); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Editar Evento' : 'Adicionar Evento'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Título do Evento</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="time">Horário (ex: 10:00 - 11:00)</Label>
                            <Input id="time" {...form.register('time')} />
                            {form.formState.errors.time && <p className="text-sm text-destructive mt-1">{form.formState.errors.time.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="icon">Ícone</Label>
                            <Controller
                                name="icon"
                                control={form.control}
                                render={({ field }) => {
                                    const IconToShow = getIcon(field.value);
                                    return (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue>
                                                    {field.value && (
                                                    <div className="flex items-center gap-2">
                                                        <IconToShow className='h-4 w-4' />
                                                        <span>{field.value}</span>
                                                    </div>
                                                    )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <ScrollArea className="h-72">
                                                {iconList.map(iconName => {
                                                    const Icon = getIcon(iconName);
                                                    return (
                                                        <SelectItem key={iconName} value={iconName}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4" />
                                                                <span>{iconName}</span>
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                })}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                )}}
                            />
                            {form.formState.errors.icon && <p className="text-sm text-destructive mt-1">{form.formState.errors.icon.message}</p>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
