
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useFabMessages, type FabMessageType, type FabMessagePayload, pipelineStepSchema } from '@/contexts/FabMessagesContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Send, MessageSquare, Edit2, Play, Pause, AlertTriangle, Search, Filter, ChevronUp, ChevronDown, Upload, FileDown, GripVertical } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../ui/dropdown-menu';

const formSchema = z.object({
    pipeline: z.array(pipelineStepSchema).min(1, "O pipeline deve ter pelo menos um passo."),
});

type FabMessageFormValues = z.infer<typeof formSchema>;
type SortKey = 'name' | 'status' | 'isActive';

const statusOptions = {
    pending_cta: { label: 'Pendente CTA', className: 'bg-yellow-100 text-yellow-800' },
    pending_follow_up: { label: 'Pendente Acomp.', className: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    not_created: { label: 'Não Criada', className: 'bg-gray-100 text-gray-800' },
};

const StatusBadge = ({ status }: { status: keyof typeof statusOptions }) => {
    const config = statusOptions[status];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};


export function ManageFabMessages() {
    const { fabMessages, upsertMessageForUser, deleteMessageForUser, resetUserSequence } = useFabMessages();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const commercialUsers = useMemo(() => {
        return collaborators.filter(c => c.axis === 'Comercial');
    }, [collaborators]);

    const userMessageMap = useMemo(() => {
        const map = new Map<string, FabMessageType>();
        fabMessages.forEach(msg => map.set(msg.userId, msg));
        return map;
    }, [fabMessages]);

     const filteredAndSortedUsers = useMemo(() => {
        let items = [...commercialUsers];

        if (searchTerm) {
            items = items.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (statusFilter.length > 0) {
            items = items.filter(user => {
                const message = userMessageMap.get(user.id3a);
                const status = message?.status || 'not_created';
                return statusFilter.includes(status);
            });
        }
        
        if (activeFilter !== 'all') {
            items = items.filter(user => {
                 const message = userMessageMap.get(user.id3a);
                 const isActive = message?.isActive ?? false;
                 return activeFilter === 'active' ? isActive : !isActive;
            });
        }
        
        items.sort((a, b) => {
            const messageA = userMessageMap.get(a.id3a);
            const messageB = userMessageMap.get(b.id3a);

            let valA: any, valB: any;
            
            switch (sortKey) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'status':
                    valA = messageA?.status || 'not_created';
                    valB = messageB?.status || 'not_created';
                    break;
                case 'isActive':
                    valA = messageA?.isActive ?? false;
                    valB = messageB?.isActive ?? false;
                    break;
                default:
                    return 0;
            }

            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

            return sortDirection === 'asc' ? comparison : -comparison;
        });


        return items;
    }, [commercialUsers, userMessageMap, searchTerm, statusFilter, activeFilter, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const toggleStatusFilter = (status: string) => {
        setStatusFilter(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const form = useForm<FabMessageFormValues>({
        resolver: zodResolver(formSchema),
    });
    
    const { formState: { isSubmitting }, reset, handleSubmit, control } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "pipeline" });


    const handleOpenForm = (user: Collaborator) => {
        setEditingUser(user);
        const existingMessage = userMessageMap.get(user.id3a);
        if (existingMessage && existingMessage.pipeline) {
            reset({ pipeline: existingMessage.pipeline });
        } else {
             reset({
                pipeline: [{
                    day: 1,
                    ctaMessage: { title: 'Temos uma novidade para você!', icon: 'MessageSquare' },
                    followUpMessage: { title: 'Obrigado pelo seu interesse!', content: 'Fique de olho para mais atualizações.', icon: 'CheckCircle', ctaText: 'Saiba Mais', ctaLink: 'https://www.google.com' }
                }]
            });
        }
        setIsFormOpen(true);
    };
    
    const handleToggleActivation = async (user: Collaborator, isActive: boolean) => {
        const message = userMessageMap.get(user.id3a);
        if (!message) {
            toast({ title: "Atenção", description: "Crie uma campanha primeiro antes de ativá-la.", variant: "destructive" });
            return;
        }
        try {
            await upsertMessageForUser(user.id3a, { isActive });
            toast({ title: "Sucesso", description: `Campanha ${isActive ? 'ativada' : 'pausada'} para ${user.name}.`, variant: 'default' });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível alterar o status da campanha.", variant: "destructive" });
        }
    };

    const onSubmit = async (data: FabMessageFormValues) => {
        if (!editingUser) return;
        
        const existingMessage = userMessageMap.get(editingUser.id3a);
        const payload: FabMessagePayload = {
            userId: editingUser.id3a,
            userName: editingUser.name,
            pipeline: data.pipeline,
            isActive: existingMessage?.isActive ?? true,
            status: existingMessage?.status || 'pending_cta',
            currentDay: existingMessage?.currentDay || 1,
        };

        try {
            await upsertMessageForUser(editingUser.id3a, payload);
            toast({ title: "Sucesso", description: `Pipeline de mensagens para ${editingUser.name} foi salvo.` });
            setIsFormOpen(false);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar o pipeline.", variant: "destructive" });
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

    const SortableHeader = ({ tKey, label }: { tKey: SortKey, label: string }) => (
        <TableHead onClick={() => handleSort(tKey)} className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-1">
                {label}
                {sortKey === tKey && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </div>
        </TableHead>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Mensagens por Colaborador</CardTitle>
                <CardDescription>Configure e envie campanhas de mensagens individuais para os colaboradores do eixo Comercial.</CardDescription>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por colaborador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" />
                                Status ({statusFilter.length || 'Todos'})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             {Object.entries(statusOptions).map(([key, { label }]) => (
                                 <DropdownMenuCheckboxItem
                                    key={key}
                                    checked={statusFilter.includes(key)}
                                    onCheckedChange={() => toggleStatusFilter(key)}
                                 >
                                     {label}
                                 </DropdownMenuCheckboxItem>
                             ))}
                        </DropdownMenuContent>
                     </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" />
                                Campanha Ativa ({activeFilter === 'all' ? 'Todas' : activeFilter === 'active' ? 'Sim' : 'Não'})
                            </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent>
                             <DropdownMenuLabel>Filtrar por Campanha Ativa</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuCheckboxItem checked={activeFilter === 'all'} onCheckedChange={() => setActiveFilter('all')}>Todas</DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem checked={activeFilter === 'active'} onCheckedChange={() => setActiveFilter('active')}>Sim</DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem checked={activeFilter === 'inactive'} onCheckedChange={() => setActiveFilter('inactive')}>Não</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader tKey="name" label="Colaborador" />
                                <SortableHeader tKey="status" label="Status da Campanha" />
                                <TableHead>Progresso</TableHead>
                                <SortableHeader tKey="isActive" label="Ativa" />
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.map(user => {
                                const message = userMessageMap.get(user.id3a);
                                return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={message?.status || 'not_created'} />
                                    </TableCell>
                                     <TableCell>
                                        {message ? `Dia ${message.currentDay}/${message.pipeline.length}` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                          checked={message?.isActive ?? false}
                                          onCheckedChange={(checked) => handleToggleActivation(user, checked)}
                                          disabled={!message}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenForm(user)} className="hover:bg-admin-primary/10 hover:text-admin-primary">
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
                            <DialogTitle>Configurar Pipeline para</DialogTitle>
                            <DialogDescription>{editingUser?.name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                                    <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">Dia {index + 1}</Badge>
                                    
                                    <h3 className="font-semibold text-lg">Passo {index + 1}: Mensagem de CTA</h3>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.ctaMessage.title`}>Título</Label>
                                        <Input {...form.register(`pipeline.${index}.ctaMessage.title`)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.ctaMessage.icon`}>Ícone</Label>
                                        <Controller name={`pipeline.${index}.ctaMessage.icon`} control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><ScrollArea className="h-60">
                                                    {iconList.map(i => <SelectItem key={i} value={i}><div className="flex items-center gap-2">{React.createElement(getIcon(i), {className:"h-4 w-4"})}<span>{i}</span></div></SelectItem>)}
                                                </ScrollArea></SelectContent>
                                            </Select>
                                        )}/>
                                    </div>
                                    <Separator />
                                    <h3 className="font-semibold text-lg">Passo {index + 1}: Mensagem de Acompanhamento</h3>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.followUpMessage.title`}>Título</Label>
                                        <Input {...form.register(`pipeline.${index}.followUpMessage.title`)} />
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor={`pipeline.${index}.followUpMessage.icon`}>Ícone</Label>
                                            <Controller name={`pipeline.${index}.followUpMessage.icon`} control={control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent><ScrollArea className="h-60">
                                                        {iconList.map(i => <SelectItem key={i} value={i}><div className="flex items-center gap-2">{React.createElement(getIcon(i), {className:"h-4 w-4"})}<span>{i}</span></div></SelectItem>)}
                                                    </ScrollArea></SelectContent>
                                                </Select>
                                            )}/>
                                        </div>
                                         <div>
                                            <Label htmlFor={`pipeline.${index}.followUpMessage.ctaText`}>Texto do Botão</Label>
                                            <Input {...form.register(`pipeline.${index}.followUpMessage.ctaText`)} />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.followUpMessage.content`}>Conteúdo</Label>
                                        <Textarea {...form.register(`pipeline.${index}.followUpMessage.content`)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`pipeline.${index}.followUpMessage.ctaLink`}>Link do Botão</Label>
                                        <Input {...form.register(`pipeline.${index}.followUpMessage.ctaLink`)} />
                                    </div>
                                     <div className="flex justify-end">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}

                             <Button type="button" variant="outline" className="w-full" onClick={() => append({ day: fields.length + 1, ctaMessage: { title: '', icon: 'MessageSquare' }, followUpMessage: { title: '', content: '', icon: 'CheckCircle', ctaText: 'Saiba Mais', ctaLink: '' }})}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Passo ao Pipeline
                            </Button>
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
                                Salvar Pipeline
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
