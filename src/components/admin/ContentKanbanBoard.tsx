
"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useKanban, KanbanColumnType, KanbanCardType, KanbanComment } from '@/contexts/KanbanContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Plus, MoreHorizontal, Trash2, X, FileText, Paperclip, Loader2, Newspaper, File, FlaskConical, MessageSquare, Link, Vote, Award, MessageCircle, Send, Edit } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/firestore-service';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { getIcon } from '@/lib/icons';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const contentTypes = [
    { value: 'news', label: 'Notícias', icon: Newspaper },
    { value: 'documents', label: 'Documentos', icon: File },
    { value: 'labs', label: 'Labs', icon: FlaskConical },
    { value: 'messages', label: 'Mensagens', icon: MessageSquare },
    { value: 'quicklinks', label: 'Links Rápidos', icon: Link },
    { value: 'polls', label: 'Pesquisas', icon: Vote },
    { value: 'rankings', label: 'Rankings', icon: Award },
];


const ColumnHeader = ({ column }: { column: KanbanColumnType }) => {
    const { updateColumn, deleteColumn } = useKanban();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(column.title);

    const handleRename = () => {
        if (title.trim() && title !== column.title) {
            updateColumn(column.id, title.trim());
        }
        setIsEditing(false);
    }

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir a coluna "${column.title}" e todos os seus cartões?`)) {
            deleteColumn(column.id);
        }
    }
    
    useEffect(() => {
        setTitle(column.title);
    }, [column.title]);

    return (
        <CardHeader className="p-3 flex flex-row items-center justify-between">
            {isEditing ? (
                 <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                    className="h-8"
                 />
            ) : (
                <h3 className="font-semibold text-sm cursor-pointer" onClick={() => setIsEditing(true)}>{column.title}</h3>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>Renomear</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
    )
}


const KanbanCard = ({ card, index, onCardClick }: { card: KanbanCardType, index: number, onCardClick: (card: KanbanCardType) => void }) => {
    const contentTypeInfo = contentTypes.find(ct => ct.value === card.contentType);
    const Icon = contentTypeInfo ? contentTypeInfo.icon : FileText;

    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided) => (
                <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    {...provided.dragHandleProps} 
                    className="mb-2"
                    onClick={() => onCardClick(card)}
                >
                    <Card className="hover:bg-muted/80 cursor-pointer">
                        <CardContent className="p-3 text-sm">
                           {card.title}
                        </CardContent>
                        <CardFooter className="p-2 pt-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {card.comments && card.comments.length > 0 && <MessageCircle className="h-4 w-4 text-muted-foreground" title={`${card.comments.length} comentário(s)`}/>}
                                {card.mediaUrl && <Paperclip className="h-4 w-4 text-muted-foreground" title="Contém anexo"/>}
                            </div>
                            {contentTypeInfo && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Icon className="h-3 w-3" />
                                    <span className="text-xs">{contentTypeInfo.label}</span>
                                </Badge>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    )
}

const KanbanColumn = ({ column, cards, onCardClick }: { column: KanbanColumnType, cards: KanbanCardType[], onCardClick: (card: KanbanCardType) => void }) => {
    const { addCard } = useKanban();
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');


    const handleAddCard = () => {
        if (newCardTitle.trim()) {
            addCard({ title: newCardTitle.trim(), columnId: column.id });
            setNewCardTitle('');
            setIsAddingCard(false);
        }
    }

    return (
        <div className="w-72 flex-shrink-0">
            <Card className="bg-muted/50 h-full flex flex-col">
                <ColumnHeader column={column} />
                <Droppable droppableId={column.id} type="card">
                    {(provided) => (
                        <ScrollArea className="flex-grow">
                            <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 pt-0 min-h-[100px]">
                                {cards.sort((a,b) => a.order - b.order).map((card, index) => <KanbanCard key={card.id} card={card} index={index} onCardClick={onCardClick}/>)}
                                {provided.placeholder}
                            </div>
                        </ScrollArea>
                    )}
                </Droppable>
                <div className="p-3 mt-auto">
                    {isAddingCard ? (
                        <div className="space-y-2">
                             <Input 
                                autoFocus 
                                placeholder="Título do novo cartão..." 
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
                            />
                            <div className="flex items-center gap-2">
                                <Button onClick={handleAddCard} size="sm" className="bg-admin-primary hover:bg-admin-primary/90">Adicionar</Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingCard(false)}>Cancelar</Button>
                            </div>
                        </div>
                    ) : (
                         <Button variant="ghost" className="w-full hover:bg-green-500/20 hover:text-green-700" onClick={() => setIsAddingCard(true)}>
                            <Plus className="h-4 w-4 mr-2"/> Adicionar Cartão
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    )
}

const AddColumnForm = ({ onAdd, onCancel }: { onAdd: (title: string) => void; onCancel: () => void; }) => {
    const [title, setTitle] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim());
            setTitle('');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-muted/60 rounded-lg space-y-2">
            <Input 
                autoFocus 
                placeholder="Nome da nova coluna..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="bg-admin-primary hover:bg-admin-primary/90">Adicionar Coluna</Button>
                <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4"/></Button>
            </div>
        </form>
    );
};

const CardDetailsModal = ({ card, isOpen, onClose }: { card: KanbanCardType | null, isOpen: boolean, onClose: () => void }) => {
    const { user } = useAuth();
    const { updateCard, deleteCard, addCommentToCard } = useKanban();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contentType, setContentType] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (card) {
            setTitle(card.title);
            setContent(card.content || '');
            setContentType(card.contentType || '');
            setFile(null); 
            setNewComment('');
            setIsEditing(false); // Default to view mode
        }
    }, [card]);
    
    const handleDelete = () => {
        if (card && window.confirm("Tem certeza que deseja excluir este cartão?")) {
            deleteCard(card.id);
            onClose();
        }
    }

    const handleAddComment = async () => {
        if (!card || !newComment.trim() || !user) return;
        
        const comment: Omit<KanbanComment, 'id'> = {
            userId: user.uid,
            userName: user.displayName || 'Usuário Desconhecido',
            content: newComment,
            timestamp: new Date().toISOString(),
        }

        try {
            await addCommentToCard(card.id, comment);
            setNewComment('');
            toast({ title: "Comentário adicionado." });
        } catch (error) {
             toast({ title: "Erro ao comentar", description: (error as Error).message, variant: "destructive" });
        }
    }

    const handleSave = async () => {
        if (!card) return;
        setIsSaving(true);
        try {
            let mediaUrl = card.mediaUrl;
            let mediaType = card.mediaType;

            if (file) {
                mediaUrl = await uploadFile(file, `kanban_${card.id}`, file.name, 'kanban-attachments');
                mediaType = file.type.startsWith('image/') ? 'image' : 'pdf';
            }
            
            await updateCard(card.id, {
                title,
                content,
                contentType,
                mediaUrl,
                mediaType,
            });
            toast({ title: "Cartão salvo com sucesso!" });
            setIsEditing(false); // Return to view mode on successful save
        } catch (error) {
            toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const ViewField = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <div className={cn("text-sm", !value && "text-muted-foreground italic")}>
                {value || 'Não definido'}
            </div>
        </div>
    );
    
    const contentTypeInfo = contentTypes.find(ct => ct.value === (isEditing ? contentType : card?.contentType));

    if (!card) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl flex flex-col h-auto max-h-[90vh]">
                <DialogHeader className="flex flex-row items-center justify-between pr-14">
                    <div className="flex-grow">
                        <DialogTitle>{isEditing ? 'Editando Cartão' : card.title}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Modifique os detalhes e salve as alterações.' : 'Visualize os detalhes do cartão e adicione comentários.'}
                        </DialogDescription>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                         {!isEditing && (
                             <Button onClick={() => setIsEditing(true)} size="sm" className="bg-admin-primary hover:bg-admin-primary/90">
                                <Edit className="mr-2 h-4 w-4"/> Editar
                            </Button>
                         )}
                         <Button variant="destructive" size="icon" onClick={handleDelete} title="Excluir Cartão">
                             <Trash2 className="h-4 w-4"/>
                         </Button>
                    </div>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full pr-6 -mr-6">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="card-title">Título</Label>
                                    <Input id="card-title" value={title} onChange={e => setTitle(e.target.value)} disabled={!isEditing} />
                                </div>
                                <div>
                                    <Label htmlFor="content-type">Tipo de Conteúdo</Label>
                                     <Select value={contentType} onValueChange={setContentType} disabled={!isEditing}>
                                        <SelectTrigger id="content-type">
                                            <SelectValue placeholder="Selecione um tipo...">
                                                 {contentTypeInfo ? (
                                                    <div className="flex items-center gap-2">
                                                        <contentTypeInfo.icon className="h-4 w-4" />
                                                        <span>{contentTypeInfo.label}</span>
                                                    </div>
                                                ) : 'Selecione um tipo...'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contentTypes.map(ct => (
                                                <SelectItem key={ct.value} value={ct.value}>
                                                    <div className="flex items-center gap-2">
                                                        <ct.icon className="h-4 w-4" />
                                                        <span>{ct.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="card-content">Descrição / Conteúdo</Label>
                                <Textarea id="card-content" value={content} onChange={e => setContent(e.target.value)} rows={6} disabled={!isEditing} />
                            </div>
                            <div>
                                <Label htmlFor="card-media">Anexo (PDF ou Imagem)</Label>
                                <Input id="card-media" type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf" disabled={!isEditing}/>
                            </div>
                             {card.mediaUrl && (
                                <div>
                                    <p className="text-sm font-medium">Anexo Atual:</p>
                                    <div className="mt-2 p-2 border rounded-md max-h-48 overflow-auto">
                                     {card.mediaType === 'image' ? (
                                        <Image src={card.mediaUrl} alt="Anexo" width={200} height={200} className="rounded-md object-cover" />
                                     ) : (
                                        <a href={card.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-2">
                                            <FileText className="h-4 w-4"/> Visualizar PDF
                                        </a>
                                     )}
                                     </div>
                                </div>
                             )}
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Comentários</h3>
                                <div className="space-y-4">
                                    {card.comments && card.comments.length > 0 ? (
                                        card.comments.map(comment => (
                                            <div key={comment.id} className="flex items-start gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="w-full">
                                                    <div className="flex items-baseline justify-between">
                                                        <p className="font-semibold text-sm">{comment.userName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ptBR })}
                                                        </p>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md whitespace-pre-wrap"><ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda.</p>
                                    )}
                                </div>
                                <div className="mt-4 flex items-start gap-2">
                                    <Textarea 
                                        placeholder="Adicionar um comentário..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        rows={2}
                                    />
                                    <Button onClick={handleAddComment} size="icon" disabled={!newComment.trim()} className="bg-admin-primary hover:bg-admin-primary/90">
                                        <Send className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
                 <DialogFooter className="pt-4">
                    {isEditing ? (
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-admin-primary hover:bg-admin-primary/90">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Salvar Alterações
                            </Button>
                        </div>
                    ) : (
                        <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                        </DialogClose>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ContentKanbanBoard() {
  const { columns, cards, loading, addColumn, moveCard } = useKanban();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCardType | null>(null);

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveCard(draggableId, source.droppableId, destination.droppableId, destination.index);
  };
  
  const handleAddColumn = (title: string) => {
    addColumn(title);
    setIsAddingColumn(false);
  }

  if (loading) {
      return <p>Carregando quadro...</p>
  }

  return (
    <>
        <div className="p-1">
            <DragDropContext onDragEnd={handleDragEnd}>
                <ScrollArea className="w-full whitespace-nowrap" orientation="horizontal">
                    <div className="flex gap-4 p-4 items-start">
                        {columns.map(column => (
                            <KanbanColumn 
                                key={column.id}
                                column={column}
                                cards={cards.filter(card => card.columnId === column.id)}
                                onCardClick={(card) => setEditingCard(card)}
                            />
                        ))}
                         <div className="w-72 flex-shrink-0">
                            {isAddingColumn ? (
                                <AddColumnForm onAdd={handleAddColumn} onCancel={() => setIsAddingColumn(false)} />
                            ) : (
                                <Button variant="outline" className="w-full h-10 border-dashed" onClick={() => setIsAddingColumn(true)}>
                                    <Plus className="mr-2 h-4 w-4"/> Adicionar nova coluna
                                </Button>
                            )}
                         </div>
                    </div>
                </ScrollArea>
            </DragDropContext>
        </div>
         <CardDetailsModal 
            card={editingCard}
            isOpen={!!editingCard}
            onClose={() => setEditingCard(null)}
        />
    </>
  );
}
