
"use client";
import React, { useState } from 'react';
import { useApplications, Application } from '@/contexts/ApplicationsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { iconList, getIcon } from '@/lib/icons';
import { ScrollArea } from '../ui/scroll-area';

const applicationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome da aplicação é obrigatório."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    type: z.enum(['workflow', 'external'], { required_error: "Tipo de aplicação é obrigatório." }),
    href: z.string().optional(),
    description: z.string().optional(), // Description for the workflow modal
}).superRefine((data, ctx) => {
    if (data.type === 'external') {
        if (!data.href || data.href.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "URL do Link é obrigatória para o tipo 'Link Externo'.",
                path: ['href'],
            });
        }
        else if (!/^(https?:\/\/|www\.)/i.test(data.href) && !/^\//.test(data.href)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Por favor, insira uma URL válida (ex: https://...).",
                path: ['href'],
            });
        }
    }
});


type ApplicationFormValues = z.infer<typeof applicationSchema>;

export function ManageApplications() {
    const { applications, addApplication, updateApplication, deleteApplicationMutation } = useApplications();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            name: '',
            icon: 'FileText',
            type: 'workflow',
            href: '',
            description: '',
        },
    });

    const watchType = form.watch('type');

    const handleDialogOpen = (app: Application | null) => {
        setEditingApplication(app);
        if (app) {
            form.reset({
                ...app,
                href: app.href || '',
                description: app.description || '',
            });
        } else {
            form.reset({
                id: undefined,
                name: '',
                icon: 'FileText',
                type: 'workflow',
                href: '',
                description: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta aplicação?")) return;
        try {
            await deleteApplicationMutation.mutateAsync(id);
            toast({ title: "Sucesso!", description: "Aplicação excluída." });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            toast({ title: "Falha na Exclusão", description: errorMessage, variant: "destructive" });
        }
    };
    
    const onSubmit = async (data: ApplicationFormValues) => {
        try {
            if (editingApplication) {
                const appData = { ...data, id: editingApplication.id } as Application;
                await updateApplication(appData);
                toast({ title: "Aplicação atualizada com sucesso." });
            } else {
                const { id, ...dataWithoutId } = data;
                await addApplication(dataWithoutId);
                toast({ title: "Aplicação adicionada com sucesso." });
            }
            setIsDialogOpen(false);
            setEditingApplication(null);
        } catch (error) {
            toast({ 
                title: "Erro ao salvar", 
                description: error instanceof Error ? error.message : "Não foi possível salvar a aplicação.",
                variant: "destructive" 
            });
        }
    };

    const filteredApplications = applications.filter(app => {
        const name = (app.name && typeof app.name === 'string') ? app.name.toLowerCase() : '';
        return name !== 'meu perfil';
    });
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Aplicações/Workflows</CardTitle>
                    <CardDescription>Adicione, edite ou remova aplicações e workflows.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen(null)} className="bg-admin-primary hover:bg-admin-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar
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
                            {filteredApplications.map(item => {
                                const Icon = getIcon(item.icon);
                                return (
                                <TableRow key={item.id}>
                                    <TableCell><Icon className="h-5 w-5 text-muted-foreground" /></TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.type === 'workflow' ? `Workflow` : 'Link Externo'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(item)} className="hover:bg-muted">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-muted" disabled={deleteApplicationMutation.isPending && deleteApplicationMutation.variables === item.id}>
                                            {deleteApplicationMutation.isPending && deleteApplicationMutation.variables === item.id ? (
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
                                <Input id="name" {...form.register('name')} disabled={form.formState.isSubmitting} />
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={form.formState.isSubmitting}>
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
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 mt-2" disabled={form.formState.isSubmitting}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="workflow" id="workflow" /><Label htmlFor="workflow">Workflow</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="external" id="external" /><Label htmlFor="external">Link Externo</Label></div>
                                </RadioGroup>
                                )}
                            />
                        </div>

                        {watchType === 'external' && (
                            <div>
                                <Label htmlFor="href">URL do Link</Label>
                                <Input id="href" {...form.register('href')} placeholder="https://..." disabled={form.formState.isSubmitting}/>
                                {form.formState.errors.href && <p className="text-sm text-destructive mt-1">{form.formState.errors.href.message}</p>}
                            </div>
                        )}

                        {watchType === 'workflow' && (
                           <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                               <h3 className="font-semibold text-lg">Configuração do Workflow</h3>
                               <div>
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea id="description" {...form.register('description')} placeholder="Instruções que aparecerão no formulário para o usuário." disabled={form.formState.isSubmitting}/>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Atualmente, todos os workflows usam um formulário padrão (início, fim, observação). Futuras customizações poderão ser adicionadas aqui.
                                </p>
                           </div>
                        )}

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
        </Card>
    );
}
