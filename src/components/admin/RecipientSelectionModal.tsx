
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = keyof Collaborator | '';
type SortDirection = 'asc' | 'desc';

interface RecipientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    allCollaborators: Collaborator[];
    selectedIds: string[];
    onConfirm: (ids: string[]) => void;
}

export function RecipientSelectionModal({
    isOpen,
    onClose,
    allCollaborators,
    selectedIds,
    onConfirm,
}: RecipientSelectionModalProps) {
    const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    useEffect(() => {
        if (isOpen) {
            if(selectedIds.includes('all')){
                setIsAllSelected(true);
                setLocalSelectedIds(new Set(allCollaborators.map(c => c.id)))
            } else {
                setIsAllSelected(false);
                setLocalSelectedIds(new Set(selectedIds));
            }
        }
    }, [isOpen, selectedIds, allCollaborators]);

    const filteredAndSortedCollaborators = useMemo(() => {
        let items = [...allCollaborators];
        if (searchTerm) {
            items = items.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.position.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortKey) {
            items.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                let comparison = 0;
                if (valA && valB) {
                    comparison = String(valA).localeCompare(String(valB));
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }
        return items;
    }, [allCollaborators, searchTerm, sortKey, sortDirection]);
    
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setIsAllSelected(checked);
        if (checked) {
            setLocalSelectedIds(new Set(allCollaborators.map(c => c.id)));
        } else {
            setLocalSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        setIsAllSelected(false);
        setLocalSelectedIds(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };
    
    const handleConfirm = () => {
        if (isAllSelected || localSelectedIds.size === allCollaborators.length) {
            onConfirm(['all']);
        } else {
            onConfirm(Array.from(localSelectedIds));
        }
    };
    
    const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => (
        <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50">
            {label}
            {sortKey === tkey && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
        </TableHead>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Selecionar Destinatários</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Pesquisar por nome, email, área..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex-grow min-h-0 border rounded-lg">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Selecionar todos"
                                        />
                                    </TableHead>
                                    <SortableHeader tkey="name" label="Nome" />
                                    <SortableHeader tkey="email" label="Email" />
                                    <SortableHeader tkey="area" label="Área" />
                                    <SortableHeader tkey="position" label="Cargo" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedCollaborators.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isAllSelected || localSelectedIds.has(c.id)}
                                                onCheckedChange={(checked) => handleSelectOne(c.id, !!checked)}
                                                aria-label={`Selecionar ${c.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell>{c.area}</TableCell>
                                        <TableCell>{c.position}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <div className="w-full flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            {isAllSelected ? allCollaborators.length : localSelectedIds.size} de {allCollaborators.length} selecionados
                        </p>
                        <div>
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="button" onClick={handleConfirm} className="ml-2">Confirmar</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
