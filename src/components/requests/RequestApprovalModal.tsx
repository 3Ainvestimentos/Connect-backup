
"use client";

import React, { useState, useMemo } from 'react';
import { format, formatISO, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkflows, WorkflowRequest, WorkflowHistoryLog } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Calendar, Type, Clock, FileText, Check, X, History, MoveRight, Users, MessageSquare, Send, ExternalLink, ShieldQuestion, CheckCircle, Hourglass } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useApplications, WorkflowStatusDefinition } from '@/contexts/ApplicationsContext';
import { AssigneeSelectionModal } from './AssigneeSelectionModal';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { RecipientSelectionModal } from '../admin/RecipientSelectionModal';

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
  const [assignee, setAssignee] = useState<Collaborator | null>(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isActionSelectionModalOpen, setIsActionSelectionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'statusChange' | 'assign' | 'comment' | 'requestAction' | null>(null);
  const [targetStatus, setTargetStatus] = useState<WorkflowStatusDefinition | null>(null);

  const definition = useMemo(() => {
    if (!request) return null;
    return workflowDefinitions.find(def => def.name === request.type);
  }, [request, workflowDefinitions]);
  
  const adminUser = useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const isOwner = useMemo(() => {
    if (!user || !definition) return false;
    return user.email === definition.ownerEmail;
  }, [user, definition]);
  
  const isAssignee = useMemo(() => {
    if (!adminUser || !request?.assignee) return false;
    return adminUser.id3a === request.assignee.id;
  }, [adminUser, request]);

  const canTakeAction = isOwner || isAssignee;

  const currentStatusDefinition = useMemo(() => {
    if (!definition || !request) return null;
    return definition.statuses.find(s => s.id === request.status);
  }, [definition, request]);

  const nextStatus = useMemo((): WorkflowStatusDefinition | null => {
    if (!definition || !request) return null;
    const currentIndex = definition.statuses.findIndex(s => s.id === request.status);
    if (currentIndex === -1 || currentIndex >= definition.statuses.length - 1) {
      return null;
    }
    return definition.statuses[currentIndex + 1];
  }, [definition, request]);

  const actionRequestsForCurrentStatus = useMemo(() => {
    if (!request?.actionRequests || !request.status) return [];
    return request.actionRequests[request.status] || [];
  }, [request]);


  React.useEffect(() => {
    if (request) {
      setComment('');
      if (request.assignee) {
        const currentAssignee = collaborators.find(c => c.id3a === request.assignee?.id);
        setAssignee(currentAssignee || null);
      } else {
        setAssignee(null);
      }
    }
  }, [request, collaborators]);

  if (!request) return null;

  const handleRequestAction = async (approverIds: string[]) => {
    setActionType('requestAction');
    setIsActionSelectionModalOpen(false);
    if (!user || !adminUser || !currentStatusDefinition?.action) return;
    if (approverIds.length === 0) return;

    setIsSubmitting(true);
    const now = new Date();
    const historyNote = `Solicitação de "${currentStatusDefinition.action.label}" enviada para ${approverIds.length} colaborador(es).`;

    const newActionRequests = approverIds.map(id => {
      const approver = collaborators.find(c => c.id3a === id);
      return {
        userId: id,
        userName: approver?.name || 'Usuário Desconhecido',
        status: 'pending',
        requestedAt: formatISO(now),
        respondedAt: '',
      };
    });

    const requestUpdate = {
      id: request.id,
      lastUpdatedAt: formatISO(now),
      actionRequests: {
        ...request.actionRequests,
        [request.status]: [...(request.actionRequests?.[request.status] || []), ...newActionRequests],
      },
      history: [...request.history, { timestamp: formatISO(now), status: request.status, userId: adminUser.id3a, userName: adminUser.name, notes: historyNote }],
    };

    const notificationMessage = `Uma ação de '${currentStatusDefinition.action.label}' foi solicitada na sua tarefa '${request.type}' #${request.requestId}.`;
    
    try {
      await updateRequestAndNotify(requestUpdate, undefined, notificationMessage);
      toast({ title: "Sucesso!", description: "Solicitação de ação enviada." });
    } catch(error) {
       toast({ title: "Erro", description: "Não foi possível solicitar a ação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };
  
  const handleStatusChange = async (newStatus: WorkflowStatusDefinition) => {
    setActionType('statusChange');
    setTargetStatus(newStatus);

    if (!user || !adminUser) {
      toast({ title: "Erro de Autenticação", description: "Você não está logado ou não foi encontrado na lista de colaboradores.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: newStatus.id,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: comment || `Status alterado para "${newStatus.label}".`,
    };
    
    const requestUpdate = {
      id: request.id,
      status: newStatus.id,
      lastUpdatedAt: formatISO(now),
      history: [...request.history, historyEntry],
    };

    const notificationMessage = `O status da sua solicitação de '${request.type}' #${request.requestId} foi atualizado para "${newStatus.label}".\nObservações: ${comment || 'Nenhuma.'}`;

    try {
      await updateRequestAndNotify(requestUpdate, notificationMessage);
      toast({
        title: "Sucesso!",
        description: `A solicitação foi atualizada para "${newStatus.label}". O usuário será notificado.`
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
    if (!user || !adminUser || !assignee) {
      toast({ title: "Erro", description: "Usuário administrador ou colaborador selecionado não encontrado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: request.status,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: comment ? `Solicitação atribuída a ${assignee.name}. Comentário: ${comment}` : `Solicitação atribuída a ${assignee.name}.`,
    };

    const requestUpdate = {
      id: request.id,
      assignee: { id: assignee.id3a, name: assignee.name },
      lastUpdatedAt: formatISO(now),
      history: [...request.history, historyEntry],
    };

    const requesterNotification = `Sua solicitação de '${request.type}' #${request.requestId} foi atribuída a ${assignee.name} para acompanhamento.`;
    const assigneeNotification = `A solicitação #${request.requestId} de '${request.type}', enviada por ${request.submittedBy.userName}, foi atribuída a você.`;

    try {
      await updateRequestAndNotify(requestUpdate, requesterNotification, assigneeNotification);
      toast({ title: "Sucesso!", description: `Solicitação atribuída a ${assignee.name}.` });
      setComment('');
    } catch (error) {
       toast({ title: "Erro", description: "Não foi possível atribuir o responsável.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  const handleAddComment = async () => {
    setActionType('comment');
    if (!comment.trim()) {
        toast({ title: "Atenção", description: "O campo de comentário não pode estar vazio.", variant: "destructive" });
        return;
    }

    if (!user || !adminUser) {
        toast({ title: "Erro de Autenticação", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const historyEntry: WorkflowHistoryLog = {
        timestamp: formatISO(now),
        status: request.status,
        userId: adminUser.id3a,
        userName: adminUser.name,
        notes: comment,
    };
    
    const requestUpdate = {
        id: request.id,
        lastUpdatedAt: formatISO(now),
        history: [...request.history, historyEntry],
    };

    const notificationMessage = `Um novo comentário foi adicionado à sua solicitação '${request.type}' #${request.requestId} por ${adminUser.name}.\nComentário: ${comment}`;
    
    try {
        await updateRequestAndNotify(requestUpdate, notificationMessage);
        toast({ title: "Sucesso!", description: "Comentário adicionado ao histórico." });
        setComment('');
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível adicionar o comentário.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setActionType(null);
    }
  };

  const renderFieldValue = (fieldId: string, value: any) => {
    const fieldDef = definition?.fields.find(f => f.id === fieldId);
    if (!fieldDef) return <p><strong>{fieldId}:</strong> {JSON.stringify(value)}</p>;
    
    let displayValue: React.ReactNode = value;

    if (fieldDef.type === 'file' && typeof value === 'string' && value) {
      const fileName = value.split('%2F').pop()?.split('?')[0] || 'Arquivo';
      return (
        <div className="flex items-center gap-2">
            <p className="text-muted-foreground"><strong className="font-medium text-foreground">{fieldDef.label}:</strong></p>
            <Button asChild variant="link" className="p-0 h-auto">
                <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    {decodeURIComponent(fileName)}
                    <ExternalLink className="h-3 w-3" />
                </a>
            </Button>
        </div>
      );
    }
    else if (fieldDef.type === 'date' && value) {
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
  
  const getActionRequestIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Hourglass className="h-4 w-4 text-yellow-500" />;
        case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'acknowledged': return <CheckCircle className="h-4 w-4 text-blue-500" />;
        case 'rejected': return <X className="h-4 w-4 text-red-500" />;
        default: return <ShieldQuestion className="h-4 w-4 text-muted-foreground" />;
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" /> Detalhes da Solicitação
            </DialogTitle>
            <DialogDescription>
              {`Revise a solicitação #${request.requestId} e tome uma ação.`}
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

              {isOwner && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Atribuir Responsável</h3>
                     <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            onClick={() => setIsAssigneeModalOpen(true)}
                            disabled={isSubmitting}
                        >
                            {assignee ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                            {assignee.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{assignee.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Selecionar um responsável...</span>
                                </div>
                            )}
                        </Button>
                         <Button 
                            onClick={handleAssigneeChange} 
                            disabled={isSubmitting || !assignee || assignee?.id3a === request.assignee?.id}
                            className="bg-admin-primary hover:bg-admin-primary/90"
                        >
                            {isSubmitting && actionType === 'assign' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Atribuir
                        </Button>
                    </div>
                </div>
              )}
            
              {currentStatusDefinition?.action && isAssignee && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Ações da Etapa</h3>
                    <Button
                        variant="outline"
                        onClick={() => setIsActionSelectionModalOpen(true)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && actionType === 'requestAction' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
                        {currentStatusDefinition.action.label}
                    </Button>
                </div>
              )}
              
              {actionRequestsForCurrentStatus.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Status das Ações Solicitadas</h3>
                  <div className="p-4 bg-muted/50 rounded-md text-sm space-y-2">
                      {actionRequestsForCurrentStatus.map((ar) => (
                          <div key={ar.userId} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  {getActionRequestIcon(ar.status)}
                                  <span>{ar.userName}</span>
                              </div>
                              <Badge variant="secondary" className="capitalize">{ar.status}</Badge>
                          </div>
                      ))}
                  </div>
                </div>
              )}

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
              
              {canTakeAction && (
                <div>
                    <Label htmlFor="comment">Adicionar Comentário</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Deixe uma observação para o solicitante e para o histórico..."
                            disabled={isSubmitting}
                        />
                        {isOwner && (
                            <Button 
                                variant="secondary" 
                                onClick={handleAddComment} 
                                disabled={isSubmitting || !comment.trim()}
                                className="h-full"
                            >
                                {isSubmitting && actionType === 'comment' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                <span className="sr-only">Salvar comentário</span>
                            </Button>
                        )}
                    </div>
                </div>
              )}
          </div>
          </ScrollArea>

          <DialogFooter className="pt-4 flex-col sm:flex-row sm:justify-between gap-2">
            <div>
                {isAssignee && nextStatus && (
                     <div className="flex flex-wrap gap-2">
                        <Button 
                            key={nextStatus.id}
                            variant="secondary"
                            onClick={() => handleStatusChange(nextStatus)} 
                            disabled={isSubmitting}
                        >
                            {(isSubmitting && actionType === 'statusChange' && targetStatus?.id === nextStatus.id) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <MoveRight className="mr-2 h-4 w-4" />
                            )}
                            Mover para "{nextStatus.label}"
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex gap-2 self-end">
                <DialogClose asChild><Button variant="outline" className="hover:bg-muted">Fechar</Button></DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AssigneeSelectionModal
          isOpen={isAssigneeModalOpen}
          onClose={() => setIsAssigneeModalOpen(false)}
          allCollaborators={collaborators}
          currentAssigneeId={assignee?.id}
          onConfirm={(selected) => {
              setAssignee(selected);
              setIsAssigneeModalOpen(false);
          }}
      />
      <RecipientSelectionModal
        isOpen={isActionSelectionModalOpen}
        onClose={() => setIsActionSelectionModalOpen(false)}
        allCollaborators={collaborators}
        selectedIds={[]}
        onConfirm={handleRequestAction}
      />
    </>
  );
}
