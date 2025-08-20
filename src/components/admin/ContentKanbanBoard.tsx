
"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useKanban, KanbanColumnType, KanbanCardType } from '@/contexts/KanbanContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, GripVertical, MoreHorizontal, Trash2, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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


const KanbanCard = ({ card, index }: { card: KanbanCardType, index: number }) => {
    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2">
                    <Card>
                        <CardContent className="p-3 text-sm">
                           {card.title}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    )
}

const KanbanColumn = ({ column, cards }: { column: KanbanColumnType, cards: KanbanCardType[] }) => {
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
                                {cards.sort((a,b) => a.order - b.order).map((card, index) => <KanbanCard key={card.id} card={card} index={index} />)}
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
                         <Button variant="ghost" className="w-full hover:bg-admin-primary hover:text-admin-primary-foreground" onClick={() => setIsAddingCard(true)}>
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

export function ContentKanbanBoard() {
  const { columns, cards, loading, addColumn, moveCard } = useKanban();
  const [isAddingColumn, setIsAddingColumn] = useState(false);

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
    <div className="p-1">
        <DragDropContext onDragEnd={handleDragEnd}>
            <ScrollArea className="w-full whitespace-nowrap" orientation="horizontal">
                <div className="flex gap-4 p-4 items-start">
                    {columns.map(column => (
                        <KanbanColumn 
                            key={column.id}
                            column={column}
                            cards={cards.filter(card => card.columnId === column.id)}
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
  );
}
