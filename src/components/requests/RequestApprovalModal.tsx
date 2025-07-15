
"use client";

import React, { useState, useMemo } from 'react';
import { format, formatISO, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkflows, WorkflowRequest, WorkflowStatus, WorkflowHistoryLog } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Calendar, Type, Clock, FileText, Check, X, History, MoveRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useApplications, WorkflowStatusDefinition } from '@/contexts/ApplicationsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkflowRequest | null;
}

export function RequestApprovalModal({ isOpen, onClose, request }: RequestApprovalModalProps) {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { updateRequestAndNotify } = useWorkflows();
  const { workflowDefinitions } = useApplications();
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState(request?.assignee?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'statusChange' | 'assign' | null>(null);
  const [targetStatus, setTargetStatus] = useState<WorkflowStatus | null>(null);

  const definition = useMemo(() => {
    if (!request) return null;
    return workflowDefinitions.find(def => def.name === request.type);
  }, [request, workflowDefinitions]);

  const availableTransitions = useMemo(() => {
    if (!definition || !request) return [];
    return definition.statuses.filter(s => s.id !== request.status);
  }, [definition, request]);

  // Reset local state when the request prop changes
  React.useEffect(() => {
    if (request) {
      setAssigneeId(request.assignee?.id || '');
      setComment('');
    }
  }, [request]);

  if (!request) return null;
  const adminUser = collaborators.find(c => c.email === user?.email);

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    setActionType('statusChange');
    setTargetStatus(newStatus);

    const newStatusLabel = definition?.statuses.find(s => s.id === newStatus)?.label || newStatus;

    if (!user || !adminUser) {
      toast({ title: "Erro de Autenticação", description: "Você não está logado ou não foi encontrado na lista de colaboradores.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: newStatus,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: comment || `Status alterado para "${newStatusLabel}".`,
    };
    
    const requestUpdate = {
      id: request.id,
      status: newStatus,
      lastUpdatedAt: formatISO(now),
      history: [...request.history, historyEntry],
    };

    const notificationMessage = `O status da sua solicitação de '${request.type}' foi atualizado para "${newStatusLabel}".\nObservações: ${comment || 'Nenhuma.'}`;

    try {
      await updateRequestAndNotify(requestUpdate, notificationMessage);
      toast({
        title: "Sucesso!",
        description: `A solicitação foi atualizada para "${newStatusLabel}". O usuário será notificado.`
      });
      setComment('');
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível processar a ação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setActionType(null);
      setTargetStatus(null);
    }
  };

  const handleAssigneeChange = async () => {
    setActionType('assign');
    const selectedCollaborator = collaborators.find(c => c.id3a === assigneeId);

    if (!user || !adminUser || !selectedCollaborator) {
      toast({ title: "Erro", description: "Usuário administrador ou colaborador selecionado não encontrado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: request.status, // Status doesn't change on assignment
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: `Solicitação atribuída a ${selectedCollaborator.name}.`,
    };

    const requestUpdate = {
      id: request.id,
      assignee: { id: selectedCollaborator.id3a, name: selectedCollaborator.name },
      lastUpdatedAt: formatISO(now),
      history: [...request.history, historyEntry],
    };

    const notificationMessage = `Sua solicitação de '${request.type}' foi atribuída a ${selectedCollaborator.name} para acompanhamento.`;

    try {
      await updateRequestAndNotify(requestUpdate, notificationMessage);
      toast({ title: "Sucesso!", description: `Solicitação atribuída a ${selectedCollaborator.name}.` });
    } catch (error) {
       toast({ title: "Erro", description: "Não foi possível atribuir o responsável.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };


  const renderFieldValue = (fieldId: string, value: any) => {
    const fieldDef = definition?.fields.find(f => f.id === fieldId);
    if (!fieldDef) return <p><strong>{fieldId}:</strong> {JSON.stringify(value)}</p>;
    
    let displayValue: React.ReactNode = value;

    if (fieldDef.type === 'date' && value) {
      const date = parseISO(value);
      displayValue = isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida';
    } else if (fieldDef.type === 'date-range' && value) {
      const from = value.from ? parseISO(value.from) : null;
      const to = value.to ? parseISO(value.to) : null;
      displayValue = (from && isValid(from) && to && isValid(to)) 
        ? `${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`
        : 'Período inválido';
    }

    return <p><strong>{fieldDef.label}:</strong> {displayValue?.toString()}</p>;
  }

  const renderFormData = () => {
    if (!request.formData || Object.keys(request.formData).length === 0) return <p>Sem dados de formulário.</p>;
    return (
        <div className="space-y-2">
            {Object.entries(request.formData).map(([key, value]) => (
                <div key={key}>
                  {renderFieldValue(key, value)}
                </div>
            ))}
        </div>
    );
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
                    <div><span className="font-semibold">Tipo:</span> {request.type}</div>
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
                <h3 className="font-semibold text-lg mb-2">Atribuir Responsável</h3>
                 <div className="flex items-center gap-2">
                    <Select value={assigneeId} onValueChange={setAssigneeId} disabled={isSubmitting}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um responsável..." />
                        </SelectTrigger>
                        <SelectContent>
                            {collaborators.map(c => <SelectItem key={c.id} value={c.id3a}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Button 
                        onClick={handleAssigneeChange} 
                        disabled={isSubmitting || !assigneeId || assigneeId === request.assignee?.id}
                        variant="secondary"
                    >
                        {isSubmitting && actionType === 'assign' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Atribuir
                    </Button>
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
                                <Badge variant="secondary" className="font-semibold">{definition?.statuses.find(s => s.id === log.status)?.label || log.status}</Badge>
                                {index !== request.history.length - 1 && <div className="w-px h-6 bg-border" />}
                            </div>
                            <div className="pt-0.5">
                                <p className="font-semibold">{log.userName} <span className="text-muted-foreground font-normal">({format(parseISO(log.timestamp), 'dd/MM/yy HH:mm')})</span></p>
                                <p className="text-muted-foreground">{log.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <Label htmlFor="comment">Adicionar Comentário (Opcional)</Label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe uma observação para o solicitante e para o histórico..."
                    disabled={isSubmitting}
                />
            </div>
        </div>
        </ScrollArea>

        <DialogFooter className="pt-4 flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map(status => (
                <Button 
                    key={status.id}
                    variant="secondary"
                    onClick={() => handleStatusChange(status.id)} 
                    disabled={isSubmitting}
                >
                    {(isSubmitting && actionType === 'statusChange' && targetStatus === status.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <MoveRight className="mr-2 h-4 w-4" />
                    )}
                    Mover para "{status.label}"
                </Button>
            ))}
          </div>
          <DialogClose asChild><Button variant="outline" className="hover:bg-muted">Fechar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
