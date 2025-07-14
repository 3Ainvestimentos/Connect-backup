
"use client";

import React, { useState } from 'react';
import { format, formatISO, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkflows, WorkflowRequest, WorkflowStatus, WorkflowHistoryLog } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Calendar, Type, Clock, FileText, Check, X, MessageSquare, History } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkflowRequest | null;
}

export function RequestApprovalModal({ isOpen, onClose, request }: RequestApprovalModalProps) {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { updateRequestAndNotify } = useWorkflows();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;
  
  const handleAction = async (newStatus: 'approved' | 'rejected') => {
    const adminUser = collaborators.find(c => c.email === user?.email);

    if (!user || !adminUser) {
        toast({ title: "Erro de Autenticação", description: "Você não está logado ou não foi encontrado na lista de colaboradores.", variant: "destructive"});
        return;
    }
    
    setIsSubmitting(true);
    const now = new Date();
    const actionText = newStatus === 'approved' ? 'aprovada' : 'rejeitada';
    
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: newStatus,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: comment || `Solicitação ${actionText}.`,
    };
    
    const requestUpdate = {
        id: request.id,
        status: newStatus,
        lastUpdatedAt: formatISO(now),
        history: [...request.history, historyEntry],
    };
    
    const notificationMessage = `Sua ${getRequestTypeLabel(request.type).toLowerCase()} foi ${actionText}. Detalhes: ${comment || 'Nenhuma observação adicional.'}`;

    try {
        await updateRequestAndNotify(requestUpdate, notificationMessage);
        toast({
            title: "Sucesso!",
            description: `A solicitação foi ${actionText}. O usuário será notificado.`
        });
        setComment('');
        onClose();
    } catch (error) {
        toast({
            title: "Erro",
            description: "Não foi possível processar a ação.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderFormData = () => {
    if (!request.formData) return <p>Sem dados de formulário.</p>;

    switch (request.type) {
      case 'Solicitação de Férias':
      case 'vacation_request':
        return (
          <div className="space-y-2">
            <p><strong>Período:</strong> {format(parseISO(request.formData.startDate), 'dd/MM/yyyy')} a {format(parseISO(request.formData.endDate), 'dd/MM/yyyy')}</p>
            {request.formData.note && <p><strong>Observação:</strong> {request.formData.note}</p>}
          </div>
        );
      default:
        // Generic fallback for any other workflow type
        return (
             <div className="space-y-2">
                {request.formData.startDate && request.formData.endDate && (
                     <p><strong>Período:</strong> {format(parseISO(request.formData.startDate), 'dd/MM/yyyy')} a {format(parseISO(request.formData.endDate), 'dd/MM/yyyy')}</p>
                )}
                {request.formData.note && <p><strong>Observação:</strong> {request.formData.note}</p>}
             </div>
        );
    }
  };

  const typeMap: { [key: string]: string } = {
    vacation_request: 'Solicitação de Férias',
  };

  const getRequestTypeLabel = (type: string) => {
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" /> Detalhes da Solicitação
          </DialogTitle>
          <DialogDescription>
            Revise as informações e tome uma ação.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Solicitante:</span> {request.submittedBy.userName}</div>
                </div>
                 <div className="flex items-start gap-3">
                    <Type className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Tipo:</span> {getRequestTypeLabel(request.type)}</div>
                </div>
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Data:</span> {format(parseISO(request.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
                 <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div><span className="font-semibold">Última Atualização:</span> {format(parseISO(request.lastUpdatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="font-semibold text-lg mb-2">Dados da Solicitação</h3>
                <div className="p-4 bg-muted/50 rounded-md text-sm">
                    {renderFormData()}
                </div>
            </div>

             <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <History className="h-5 w-5"/>
                    Histórico de Auditoria
                </h3>
                <div className="space-y-3">
                    {request.history.slice().reverse().map((log, index) => (
                        <div key={index} className="flex items-start gap-3 text-xs">
                            <div className="flex flex-col items-center">
                                <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                                    {log.status === 'approved' ? <Check size={14}/> : log.status === 'rejected' ? <X size={14}/> : <User size={12}/>}
                                </div>
                                {index !== request.history.length - 1 && <div className="w-px h-6 bg-border" />}
                            </div>
                            <div>
                                <p className="font-semibold">{log.userName} <span className="text-muted-foreground font-normal">({format(parseISO(log.timestamp), 'dd/MM/yy HH:mm')})</span></p>
                                <p className="text-muted-foreground">{log.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {request.status === 'pending' && (
                <div>
                    <Label htmlFor="comment">Adicionar Comentário (Opcional)</Label>
                    <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Deixe um comentário para o solicitante..."
                        disabled={isSubmitting}
                    />
                </div>
            )}
        </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="outline" className="hover:bg-muted">Fechar</Button></DialogClose>
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => handleAction('rejected')} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Rejeitar
              </Button>
              <Button 
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction('approved')} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Aprovar
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
