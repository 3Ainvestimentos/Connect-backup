
"use client";

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, compareDesc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FabMessageType, CampaignType } from '@/contexts/FabMessagesContext';
import { Send, CheckCircle, XCircle } from 'lucide-react';

interface CampaignLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: FabMessageType | null;
}

const getStatusBadge = (status: CampaignType['status']) => {
    switch (status) {
        case 'loaded': return <Badge variant="outline">Carregada</Badge>;
        case 'active': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ativa</Badge>;
        case 'completed': return <Badge variant="default" className="bg-success hover:bg-success/90">Concluída</Badge>;
        default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
}

export function CampaignLogModal({ isOpen, onClose, message }: CampaignLogModalProps) {
    const activeCampaigns = useMemo(() => {
        if (!message?.pipeline) return [];
        // Sort campaigns by sentAt date, most recent first. Campaigns without sentAt are pushed to the bottom.
        return [...message.pipeline].sort((a, b) => {
            if (a.sentAt && b.sentAt) {
                return compareDesc(parseISO(a.sentAt), parseISO(b.sentAt));
            }
            if (a.sentAt) return -1; // a comes first
            if (b.sentAt) return 1;  // b comes first
            return 0; // Keep original order if both are unsent
        });
    }, [message]);
    
    if (!message) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Histórico de Campanhas do Pipeline</DialogTitle>
                    <DialogDescription>
                        Acompanhe os logs de envio e clique para o colaborador: {message.userName}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID da Campanha</TableHead>
                                    <TableHead>Campanha (CTA)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data de Envio</TableHead>
                                    <TableHead>Data do Clique</TableHead>
                                    <TableHead>Data de Fechamento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeCampaigns.length > 0 ? activeCampaigns.map(campaign => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{campaign.id.slice(-8)}</TableCell>
                                        <TableCell className="font-medium max-w-xs truncate">{campaign.ctaMessage}</TableCell>
                                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                        <TableCell>
                                            {campaign.sentAt ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Send className="h-3 w-3 text-muted-foreground" />
                                                    {format(parseISO(campaign.sentAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.clickedAt ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <CheckCircle className="h-3 w-3 text-success" />
                                                    {format(parseISO(campaign.clickedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.followUpClosedAt ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <XCircle className="h-3 w-3 text-destructive" />
                                                    {format(parseISO(campaign.followUpClosedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            Nenhuma campanha no pipeline ativo.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
