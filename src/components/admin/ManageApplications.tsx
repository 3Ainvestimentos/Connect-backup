
"use client";
import React, { useState, useEffect } from 'react';
import { useApplications, Application, ApplicationLinkItem } from '@/contexts/ApplicationsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { iconList, getIcon } from '@/lib/icons';
import { ScrollArea } from '../ui/scroll-area';

const linkItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Rótulo é obrigatório"),
  subtext: z.string().optional(),
  link: z.string().optional(),
});

const applicationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome da aplicação é obrigatório."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    type: z.enum(['modal', 'external'], { required_error: "Tipo de aplicação é obrigatório." }),
    modalId: z.enum(['profile', 'vacation', 'support', 'admin', 'marketing', 'generic']).optional(),
    href: z.string().optional(),
    content: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        items: z.array(linkItemSchema).optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'external') {
        if (!data.href) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "URL do Link é obrigatória para o tipo 'Link Externo'.",
                path: ['href'],
            });
        } else {
            const urlCheck = z.string().url("URL inválida.").safeParse(data.href);
            if (!urlCheck.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Por favor, insira uma URL válida (ex: https://...).",
                    path: ['href'],
                });
            }
        }
    }
    if (data.type === 'modal' && !data.modalId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tipo de Modal é obrigatório para o tipo 'Modal'.",
            path: ['modalId'],
        });
    }
    if (data.modalId === 'generic' && (!data.content?.title || data.content.title.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Título do Modal é obrigatório para um modal genérico.",
            path: ['content.title'],
        });
    }
});


type ApplicationFormValues = z.infer<typeof applicationSchema>;

export function ManageApplications() {
    const { applications, addApplication, updateApplication, deleteApplication } = useApplications();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            name: '',
            icon: 'HelpCircle',
            type: 'modal',
            modalId: 'generic',
            href: '',
            content: { title: '', description: '', items: [] },
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "content.items",
    });

    const watchType = form.watch('type');
    const watchModalId = form.watch('modalId');

    const handleDialogOpen = (app: Application | null) => {
        setEditingApplication(app);
        if (app) {
            // When editing, provide complete data to the form
            form.reset({
                ...app,
                href: app.href || '',
                content: app.content || { title: '', description: '', items: [] },
            });
        } else {
            // When adding, reset to clean default values
            form.reset({
                id: undefined,
                name: '',
                icon: 'HelpCircle',
                type: 'modal',
                modalId: 'generic',
                href: '',
                content: { title: '', description: '', items: [] },
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta aplicação?")) {
            deleteApplication(id);
            toast({ title: "Aplicação excluída com sucesso." });
        }
    };
    
    const onSubmit = (data: ApplicationFormValues) => {
        if (editingApplication) {
            const appData = { ...data, id: editingApplication.id } as Application;
            updateApplication(appData);
            toast({ title: "Aplicação atualizada com sucesso." });
        } else {
            const { id, ...dataWithoutId } = data;
            addApplication(dataWithoutId);
            toast({ title: "Aplicação adicionada com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingApplication(null);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Aplicações</CardTitle>
                    <CardDescription>Adicione, edite ou remova aplicações.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Aplicação
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ícone</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map(item => {
                                const Icon = getIcon(item.icon);
                                return (
                                <TableRow key={item.id}>
                                    <TableCell><Icon className="h-5 w-5 text-muted-foreground" /></TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.type === 'modal' ? `Modal (${item.modalId})` : 'Link Externo'}</TableCell>
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

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingApplication(null); setIsDialogOpen(isOpen); }}>
                <DialogContent className="max-w-2xl">
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 pt-0">
                    <DialogHeader>
                        <DialogTitle>{editingApplication ? 'Editar Aplicação' : 'Adicionar Aplicação'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Nome da Aplicação</Label>
                                <Input id="name" {...form.register('name')} />
                                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
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
                        </div>

                        <div>
                            <Label>Tipo de Aplicação</Label>
                             <Controller
                                name="type"
                                control={form.control}
                                render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="modal" id="modal" /><Label htmlFor="modal">Modal</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="external" id="external" /><Label htmlFor="external">Link Externo</Label></div>
                                </RadioGroup>
                                )}
                            />
                        </div>

                        {watchType === 'external' && (
                            <div>
                                <Label htmlFor="href">URL do Link</Label>
                                <Input id="href" {...form.register('href')} placeholder="https://..." />
                                {form.formState.errors.href && <p className="text-sm text-destructive mt-1">{form.formState.errors.href.message}</p>}
                            </div>
                        )}

                        {watchType === 'modal' && (
                            <div>
                                <Label htmlFor="modalId">Tipo de Modal</Label>
                                <Controller
                                    name="modalId"
                                    control={form.control}
                                    render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Selecione um tipo de modal" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="profile">Perfil</SelectItem>
                                            <SelectItem value="vacation">Férias</SelectItem>
                                            <SelectItem value="support">Suporte TI</SelectItem>
                                            <SelectItem value="admin">Administrativo</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="generic">Genérico (Customizável)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    )}
                                />
                                {form.formState.errors.modalId && <p className="text-sm text-destructive mt-1">{form.formState.errors.modalId.message}</p>}
                            </div>
                        )}

                        {watchType === 'modal' && watchModalId === 'generic' && (
                            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                                <h3 className="font-semibold text-lg">Conteúdo do Modal Genérico</h3>
                                <div>
                                    <Label htmlFor="content.title">Título do Modal</Label>
                                    <Input id="content.title" {...form.register('content.title')} />
                                    {form.formState.errors.content?.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.content.title.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="content.description">Descrição</Label>
                                    <Textarea id="content.description" {...form.register('content.description')} />
                                </div>
                                <div>
                                    <Label>Itens do Modal</Label>
                                    <div className="space-y-3 mt-2">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-background">
                                                <Label>Item {index + 1}</Label>
                                                <Input {...form.register(`content.items.${index}.label`)} placeholder="Rótulo (ex: Reembolso de Despesas)" />
                                                <Input {...form.register(`content.items.${index}.subtext`)} placeholder="Texto de apoio (opcional)" />
                                                <Input {...form.register(`content.items.${index}.link`)} placeholder="URL do link (opcional)" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({id: `item-${Date.now()}`, label: '', subtext: '', link: ''})}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                                    </Button>
                                </div>
                            </div>
                        )}

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
