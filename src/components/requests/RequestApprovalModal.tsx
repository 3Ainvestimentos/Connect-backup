
"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { Loader2, User, Calendar, Type, Clock, FileText, Check, X, History, MoveRight, Users, MessageSquare, Send, ExternalLink, ShieldQuestion, CheckCircle, Hourglass, XCircle, ThumbsUp, ThumbsDown, Paperclip, UploadCloud } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useApplications, WorkflowStatusDefinition } from '@/contexts/ApplicationsContext';
import { AssigneeSelectionModal } from './AssigneeSelectionModal';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { uploadFile } from '@/lib/firestore-service';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RecipientSelectionModal } from '../admin/RecipientSelectionModal';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkflowRequest | null;
}

const actionStatusTranslations: { [key: string]: string } = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  acknowledged: 'Ciente',
  executed: 'Executado',
};

const actionStatusPastTense: { [key: string]: string } = {
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  acknowledged: 'Registrada como ciente',
  executed: 'Executada',
};

const getTranslatedStatus = (status: string) => actionStatusTranslations[status] || status;


export function RequestApprovalModal({ isOpen, onClose, request }: RequestApprovalModalProps) {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { updateRequestAndNotify } = useWorkflows();
  const { workflowDefinitions } = useApplications();
  const { workflowAreas } = useWorkflowAreas();

  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [assignee, setAssignee] = useState<Collaborator | null>(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isActionRecipientModalOpen, setIsActionRecipientModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'statusChange' | 'assign' | 'comment' | 'requestAction' | 'actionResponse' | null>(null);
  const [targetStatus, setTargetStatus] = useState<WorkflowStatusDefinition | null>(null);
  const [actionResponse, setActionResponse] = useState<'approved' | 'rejected' | 'acknowledged' | 'executed' | null>(null);


  const definition = useMemo(() => {
    if (!request) return null;
    return workflowDefinitions.find(def => def.name === request.type);
  }, [request, workflowDefinitions]);
  
  const workflowArea = useMemo(() => {
    if (!definition) return null;
    return workflowAreas.find(area => area.id === definition.areaId);
  }, [definition, workflowAreas]);

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
  
  const actionRequestsForCurrentStatus = useMemo(() => {
    if (!request?.actionRequests || !request.status) return [];
    return request.actionRequests[request.status] || [];
  }, [request]);

  const currentUserActionRequest = useMemo(() => {
    if (!adminUser) return null;
    return actionRequestsForCurrentStatus.find(ar => ar.userId === adminUser.id3a) || null;
  }, [actionRequestsForCurrentStatus, adminUser]);

  const canTakeAction = useMemo(() => {
    if (!user || !adminUser) return false;
    return isOwner || isAssignee;
  }, [user, adminUser, isOwner, isAssignee]);


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


  useEffect(() => {
    if (request) {
      setComment('');
      setAttachment(null);
      if (request.assignee) {
        const currentAssignee = collaborators.find(c => c.id3a === request.assignee?.id);
        setAssignee(currentAssignee || null);
      } else {
        setAssignee(null);
      }
    }
  }, [request, collaborators, isOpen]);

  if (!request) return null;
  
  const handleRequestAction = async (recipientIds: string[]) => {
    setActionType('requestAction');
    if (!adminUser || !currentStatusDefinition?.action) {
      toast({ title: "Erro", description: "Não foi possível identificar o solicitante ou a ação.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const now = new Date();

    const existingUserIds = new Set(actionRequestsForCurrentStatus.map(ar => ar.userId));
    const newRecipients = recipientIds
      .map(id => collaborators.find(c => c.id3a === id))
      .filter((c): c is Collaborator => !!c && !existingUserIds.has(c.id3a));

    if (newRecipients.length === 0) {
      toast({ title: "Nenhuma ação necessária", description: "Todos os usuários selecionados já têm uma solicitação de ação pendente ou foram removidos.", variant: "default" });
      setIsSubmitting(false);
      setActionType(null);
      return;
    }

    const newActionRequests = newRecipients.map(recipient => ({
      userId: recipient.id3a,
      userName: recipient.name,
      status: 'pending' as const,
      requestedAt: formatISO(now),
    }));
    
    const historyNote = `Ação de "${currentStatusDefinition.action.label}" solicitada para ${newRecipients.map(r => r.name).join(', ')}.`;
    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: request.status,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: historyNote,
    };
    
    const requestUpdate = {
        id: request.id,
        lastUpdatedAt: formatISO(now),
        actionRequests: {
            ...request.actionRequests,
            [request.status]: [...actionRequestsForCurrentStatus, ...newActionRequests],
        },
        history: [...request.history, historyEntry],
    };

    try {
        await updateRequestAndNotify(requestUpdate, undefined, `Você tem uma nova ação pendente para a solicitação #${request.requestId}.`);
        toast({ title: "Sucesso!", description: "Solicitação de ação enviada.", variant: 'success' });
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível solicitar a ação.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setActionType(null);
    }
  };

  const handleActionResponse = async (response: 'approved' | 'rejected' | 'acknowledged' | 'executed') => {
    setActionType('actionResponse');
    setActionResponse(response);
    if (!user || !adminUser || !currentUserActionRequest) return;
    
    const actionDef = currentStatusDefinition?.action;
    
    if (response === 'executed' && actionDef?.type === 'execution') {
        if (actionDef.commentRequired && !comment.trim()) {
            toast({ title: "Erro de Validação", description: "O comentário é obrigatório para esta ação.", variant: "destructive" });
            setActionResponse(null);
            return;
        }
    }
    
    setIsSubmitting(true);
    
    const now = new Date();
    const actionLabel = actionStatusPastTense[response] || 'Processada';
    let historyNote = `Ação foi ${actionLabel}.`;
    let attachmentUrl = '';

    try {
        const storagePath = workflowArea?.storageFolderPath;
        if (!storagePath) {
            throw new Error(`A área de workflow para "${definition?.name}" não tem uma pasta de armazenamento configurada.`);
        }
        if (response === 'executed' && attachment) {
            attachmentUrl = await uploadFile(attachment, storagePath, request.id, attachment.name);
            historyNote += ` Anexo: ${attachment.name}.`;
        }
    } catch (e) {
        toast({ title: "Erro de Upload", description: "Não foi possível enviar o anexo. A ação foi cancelada.", variant: "destructive"});
        setIsSubmitting(false);
        setActionType(null);
        setActionResponse(null);
        return;
    }
    
    if (comment.trim()) {
        historyNote += ` Comentário: ${comment}`;
    }
    
    const updatedActionRequests = actionRequestsForCurrentStatus.map(ar => 
        ar.userId === adminUser.id3a ? { 
          ...ar, 
          status: response, 
          respondedAt: formatISO(now),
          comment: comment || '',
          attachmentUrl: attachmentUrl || '',
        } : ar
    );

    const requestUpdate = {
        id: request.id,
        lastUpdatedAt: formatISO(now),
        actionRequests: {
            ...request.actionRequests,
            [request.status]: updatedActionRequests,
        },
        history: [...request.history, { timestamp: formatISO(now), status: request.status, userId: adminUser.id3a, userName: adminUser.name, notes: historyNote }],
    };

    const notificationMessage = `A ação na tarefa '${request.type}' #${request.requestId} foi ${actionLabel.toLowerCase()} por ${adminUser.name}.`;

    try {
        await updateRequestAndNotify(requestUpdate, undefined, notificationMessage);
        toast({ title: "Sucesso!", description: `Ação registrada como "${getTranslatedStatus(response)}".`, variant: 'success' });
        setComment('');
        setAttachment(null);
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível registrar sua ação.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setActionType(null);
        setActionResponse(null);
    }
  };

  const handleStatusChange = async (newStatus: WorkflowStatusDefinition) => {
    setActionType('statusChange');
    setTargetStatus(newStatus);
    
    if (!user || !adminUser) {
      toast({ title: "Erro de Autenticação", description: "Você não está logado ou não foi encontrado na lista de colaboradores.", variant: "destructive" });
      setIsSubmitting(false);
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
        description: `A solicitação foi atualizada para "${newStatus.label}". O usuário será notificado.`,
        variant: 'success'
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
    
    if (assignee.id3a === request.assignee?.id) {
        toast({ title: "Atenção", description: "Este colaborador já é o responsável." });
        setActionType(null);
        return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const historyNote = `Solicitação atribuída a ${assignee.name}.` + (comment ? ` Comentário: ${comment}` : '');

    const historyEntry: WorkflowHistoryLog = {
      timestamp: formatISO(now),
      status: request.status,
      userId: adminUser.id3a,
      userName: adminUser.name,
      notes: historyNote,
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
      toast({ title: "Sucesso!", description: `Solicitação atribuída a ${assignee.name}.`, variant: 'success' });
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
        toast({ title: "Sucesso!", description: "Comentário adicionado ao histórico.", variant: 'success' });
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
      const date = typeof value === 'string' ? parseISO(value) : value;
      displayValue = isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida';
    } else if (fieldDef.type === 'date-range' && value) {
      const from = value.from ? parseISO(value.from) : null;
      const to = value.to ? parseISO(value.to) : null;
      displayValue = (from && isValid(from) && to && isValid(to)) 
        ? `${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`
        : 'Período inválido';
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
        <strong>{fieldDef.label}:</strong>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayValue?.toString() || ''}</ReactMarkdown>
      </div>
    );
  }

  const renderFormData = () => {
    if (!definition || !definition.fields) return <p className="text-muted-foreground">Sem definição de formulário encontrada.</p>;
    if (!request.formData || Object.keys(request.formData).length === 0) return <p className="text-muted-foreground">O solicitante não preencheu dados no formulário.</p>;
    
    const renderedKeys = new Set<string>();

    return (
        <div className="space-y-2">
            {definition.fields.map(field => {
                const value = request.formData[field.id];
                if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                    return null;
                }
                renderedKeys.add(field.id);
                return (
                    <div key={field.id}>
                        {renderFieldValue(field.id, value)}
                    </div>
                );
            })}
            {Object.entries(request.formData).map(([key, value]) => {
              if (!renderedKeys.has(key)) {
                return (
                  <div key={key}>
                    {renderFieldValue(key, value)}
                  </div>
                )
              }
              return null;
            })}
        </div>
    );
  };
  
  const getActionRequestIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Hourglass className="h-4 w-4 text-yellow-500" />;
        case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'acknowledged': return <CheckCircle className="h-4 w-4 text-blue-500" />;
        case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
        case 'executed': return <CheckCircle className="h-4 w-4 text-purple-500" />;
        default: return <ShieldQuestion className="h-4 w-4 text-muted-foreground" />;
    }
  }

  const renderCurrentUserAction = () => {
      if (!currentUserActionRequest) return null;
      
      const actionDef = currentStatusDefinition?.action;
      const isPending = currentUserActionRequest.status === 'pending';

      if (!isPending) {
        const statusConfig = {
          approved: { icon: ThumbsUp, color: 'bg-success', text: 'Aprovado' },
          rejected: { icon: ThumbsDown, color: 'bg-destructive', text: 'Rejeitado' },
          acknowledged: { icon: CheckCircle, color: 'bg-blue-600', text: 'Ciente' },
          executed: { icon: CheckCircle, color: 'bg-purple-600', text: 'Executado' },
        }[currentUserActionRequest.status] || { icon: CheckCircle, color: 'bg-muted', text: 'Concluído' };

        const Icon = statusConfig.icon;
        
        return (
          <Button disabled className={cn("w-full", statusConfig.color)}>
            <Icon className="mr-2 h-4 w-4" /> {statusConfig.text}
          </Button>
        )
      }
      
      return (
         <div className="mt-4 pt-4 border-t">
          {actionDef?.type === 'approval' && (
            <div className="flex flex-wrap gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleActionResponse('rejected')} disabled={isSubmitting}>
                  {isSubmitting && actionResponse === 'rejected' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
                    Reprovar
                </Button>
                <Button className="bg-success hover:bg-success/90 text-success-foreground" size="sm" onClick={() => handleActionResponse('approved')} disabled={isSubmitting}>
                    {isSubmitting && actionResponse === 'approved' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                    Aprovar
                </Button>
            </div>
          )}
          {actionDef?.type === 'execution' && (
            <div className="w-full space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="execution_comment">Comentário {actionDef?.commentRequired && '*'}</Label>
                    <Textarea id="execution_comment" value={comment} onChange={e => setComment(e.target.value)} placeholder={actionDef?.commentPlaceholder || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="execution_attachment">Anexo</Label>
                    <Input id="execution_attachment" type="file" onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)} placeholder={actionDef?.attachmentPlaceholder || ''}/>
                </div>
                <Button className="w-full bg-admin-primary hover:bg-admin-primary/90" onClick={() => handleActionResponse('executed')} disabled={isSubmitting}>
                    {isSubmitting && actionResponse === 'executed' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Confirmar Execução
                </Button>
            </div>
          )}
          {actionDef?.type === 'acknowledgement' && (
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => handleActionResponse('acknowledged')} disabled={isSubmitting}>
                {isSubmitting && actionResponse === 'acknowledged' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Marcar como Ciente
            </Button>
          )}
        </div>
      );
  }

  const findActionResponseForHistoryLog = (log: WorkflowHistoryLog) => {
      for (const statusId in request.actionRequests) {
          const actionReqs = request.actionRequests[statusId];
          const matchingAction = actionReqs.find(ar => 
              ar.userId === log.userId && 
              ar.respondedAt && 
              Math.abs(parseISO(ar.respondedAt).getTime() - parseISO(log.timestamp).getTime()) < 2000
          );
          if (matchingAction) {
              return matchingAction;
          }
      }
      return null;
  };

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
                  <div className="p-4 bg-muted/50 rounded-md text-sm break-words whitespace-pre-wrap">
                      {renderFormData()}
                  </div>
              </div>

              {canTakeAction && (
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
                                        {assignee.photoURL ? <AvatarImage src={assignee.photoURL} alt={assignee.name} /> : null}
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
                            onClick={() => handleAssigneeChange()} 
                            disabled={isSubmitting || !assignee || assignee?.id3a === request.assignee?.id}
                            className="bg-admin-primary hover:bg-admin-primary/90"
                        >
                            {isSubmitting && actionType === 'assign' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Atribuir
                        </Button>
                    </div>
                </div>
              )}
              
              {actionRequestsForCurrentStatus.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Histórico de Ações Solicitadas</h3>
                  <div className="p-4 bg-muted/50 rounded-md text-sm space-y-2">
                      {actionRequestsForCurrentStatus.map((ar) => {
                        const isCurrentUserAction = ar.userId === adminUser?.id3a;
                        return (
                          <div key={ar.userId} className={cn("p-2 border rounded-md")}>
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      {getActionRequestIcon(ar.status)}
                                      <span>{ar.userName}</span>
                                  </div>
                                  <Badge variant="secondary" className="capitalize">{getTranslatedStatus(ar.status)}</Badge>
                              </div>

                              {isCurrentUserAction && renderCurrentUserAction()}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}


               <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <History className="h-5 w-5"/>
                      Histórico de Auditoria
                  </h3>
                  <div className="space-y-3">
                      {request.history.slice().reverse().map((log, index) => {
                          const actionResponse = findActionResponseForHistoryLog(log);
                          const attachmentUrl = actionResponse?.attachmentUrl;
                          const fileName = attachmentUrl ? decodeURIComponent(attachmentUrl.split('%2F').pop()?.split('?')[0] || 'Anexo') : null;

                          return (
                              <div key={index} className="flex items-start gap-3 text-xs">
                                  <div className="flex flex-col items-center">
                                      <Badge variant="secondary" className="font-semibold">{definition?.statuses.find(s => s.id === log.status)?.label || log.status}</Badge>
                                      {index !== request.history.length - 1 && <div className="w-px h-6 bg-border" />}
                                  </div>
                                  <div className="pt-0.5 flex-grow prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                                      <p className="font-semibold">{log.userName} <span className="text-muted-foreground font-normal">({format(parseISO(log.timestamp), 'dd/MM/yy HH:mm')})</span></p>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-muted-foreground">{log.notes}</ReactMarkdown>
                                      {attachmentUrl && fileName && (
                                          <Button variant="outline" size="sm" asChild className="mt-1 h-auto px-2 py-1 text-xs">
                                              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                  <Paperclip className="mr-1.5 h-3 w-3" /> {fileName}
                                              </a>
                                          </Button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
              
              {(canTakeAction) && (
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
                        {(isOwner || isAssignee) && (
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

          <DialogFooter className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex-grow flex items-center gap-2">
                {canTakeAction && nextStatus && (
                     <Button 
                        key={nextStatus.id}
                        className="bg-admin-primary hover:bg-admin-primary/90"
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
                )}
                {canTakeAction && currentStatusDefinition?.action && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsActionRecipientModalOpen(true)}
                        disabled={isSubmitting}
                    >
                        <Send className="mr-2 h-4 w-4"/>
                        Solicitar Ação
                    </Button>
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
          currentAssigneeId={assignee?.id3a}
          onConfirm={(selected) => {
              setAssignee(selected);
              setIsAssigneeModalOpen(false);
          }}
      />
       <RecipientSelectionModal
          isOpen={isActionRecipientModalOpen}
          onClose={() => setIsActionRecipientModalOpen(false)}
          allCollaborators={collaborators}
          selectedIds={[]}
          onConfirm={(ids) => {
            handleRequestAction(ids);
            setIsActionRecipientModalOpen(false);
          }}
       />
    </>
  );
}

    