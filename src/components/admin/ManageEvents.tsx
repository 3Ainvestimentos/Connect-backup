
"use client";
import React, { useState } from 'react';
import { useEvents, type EventType } from '@/contexts/EventsContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { iconList, getIcon } from '@/lib/icons';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { RecipientSelectionModal } from './RecipientSelectionModal';
import { parseISO, format, isValid } from 'date-fns';

const eventSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    time: z.string().min(1, "Horário é obrigatório"),
    location: z.string().min(1, "Local é obrigatório"),
    icon: z.string().min(1, "Ícone é obrigatório"),
    recipientIds: z.array(z.string()).min(1, "Selecione ao menos um destinatário."),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function ManageEvents() {
    const { events, addEvent, updateEvent, deleteEvent } = useEvents();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: { recipientIds: ['all'] }
    });
    
    const watchRecipientIds = form.watch('recipientIds');

    const handleDialogOpen = (event: EventType | null) => {
        setEditingEvent(event);
        if (event) {
            const parsedDate = event.date ? parseISO(event.date) : new Date();
            const dateValue = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

            form.reset({
              ...event,
              date: dateValue,
            });
        } else {
            form.reset({
                id: undefined,
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: '',
                location: '',
                icon: 'CalendarDays',
                recipientIds: ['all']
            });
        }
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este evento?")) {
            try {
                await deleteEvent(id);
                toast({ title: "Evento excluído com sucesso." });
            } catch (error) {
                toast({
                    title: "Erro ao excluir",
                    description: error instanceof Error ? error.message : "Não foi possível remover o evento.",
                    variant: "destructive"
                });
            }
        }
    };
    
    const onSubmit = async (data: EventFormValues) => {
        setIsSubmitting(true);
        try {
            // Ensure the date is stored in a consistent format (ISO string at UTC)
            const submissionData = {
                ...data,
                date: new Date(data.date).toISOString(),
            };

            if (editingEvent) {
                await updateEvent({ ...editingEvent, ...submissionData });
                toast({ title: "Evento atualizado com sucesso." });
            } else {
                const { id, ...dataWithoutId } = submissionData;
                await addEvent(dataWithoutId as Omit<EventType, 'id'>);
                toast({ title: "Evento adicionado com sucesso." });
            }
            setIsFormOpen(false);
            setEditingEvent(null);
        } catch(error) {
            toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível salvar o evento.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRecipientDescription = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Nenhum destinatário';
        if (ids.includes('all')) return 'Todos os Colaboradores';
        return `${ids.length} colaborador(es) selecionado(s)`;
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
                                <TableHead>Título</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Horário</TableHead>
                                <TableHead>Destinatários</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map(item => {
                                const Icon = getIcon(item.icon);
                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                      <Icon className="h-5 w-5 text-muted-foreground" />
                                      {item.title}
                                    </TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                                    <TableCell>{item.time}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {getRecipientDescription(item.recipientIds)}
                                        </Badge>
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

             <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingEvent(null); setIsFormOpen(isOpen); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Editar Evento' : 'Adicionar Evento'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Título do Evento</Label>
                                <Input id="title" {...form.register('title')} disabled={isSubmitting}/>
                                {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="date">Data</Label>
                                <Input id="date" type="date" {...form.register('date')} disabled={isSubmitting}/>
                                {form.formState.errors.date && <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>}
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="time">Horário (ex: 10:00 - 11:00)</Label>
                                <Input id="time" {...form.register('time')} disabled={isSubmitting}/>
                                {form.formState.errors.time && <p className="text-sm text-destructive mt-1">{form.formState.errors.time.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="location">Local</Label>
                                <Input id="location" {...form.register('location')} disabled={isSubmitting}/>
                                {form.formState.errors.location && <p className="text-sm text-destructive mt-1">{form.formState.errors.location.message}</p>}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="icon">Ícone</Label>
                            <Controller
                                name="icon"
                                control={form.control}
                                render={({ field }) => {
                                    const IconToShow = getIcon(field.value);
                                    return (
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
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
        </Card>
    );
}
