
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, getNextSequentialId, listenToCollection, getCollection, getDocument } from '@/lib/firestore-service';
import { useMessages } from './MessagesContext';
import { useApplications } from './ApplicationsContext';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';
import { useCollaborators } from './CollaboratorsContext';
import { useAuth } from './AuthContext';
import { formatISO } from 'date-fns';
import { findCollaboratorByEmail, filterCollaboratorsByEmails } from '@/lib/email-utils';

// Define os possíveis status de um workflow
export type WorkflowStatus = string; // Now a generic string, e.g., 'pending_approval', 'in_progress'

// Define o registro do histórico para auditoria
export interface WorkflowHistoryLog {
  timestamp: string; // ISO String
  status: WorkflowStatus;
  userId: string; // ID 3A RIVA do usuário que realizou a ação
  userName: string;
  notes?: string;
}

// Define a estrutura para uma solicitação de ação (Aprovação/Ciente)
export interface ActionRequest {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'executed';
  requestedAt: string; // ISO String
  respondedAt?: string; // ISO String
  comment?: string;
  attachmentUrl?: string;
}

// Define a estrutura principal de uma solicitação de workflow
export interface WorkflowRequest {
  id: string;
  requestId: string; // The user-facing sequential ID, e.g., "0001"
  type: string; // Ex: 'vacation_request', 'reimbursement'
  status: WorkflowStatus;
  ownerEmail: string; // Email of the workflow definition owner
  submittedBy: {
    userId: string; // ID 3A RIVA do colaborador
    userName: string;
    userEmail: string;
  };
  submittedAt: string; // ISO String
  lastUpdatedAt: string; // ISO String
  formData: Record<string, any>; // Objeto flexível para os dados do formulário
  history: WorkflowHistoryLog[];
  assignee?: { // Responsável pela tarefa
      id: string; // ID 3A RIVA do responsável
      name: string;
  };
  viewedBy: string[]; // Array of admin 'id3a' who have seen this request while it was pending
  isArchived?: boolean; // Flag for soft deletion by owner
  actionRequests?: {
    [statusId: string]: ActionRequest[]; // Key is the status ID where the action was requested
  };
}

interface WorkflowsContextType {
  requests: WorkflowRequest[];
  loading: boolean;
  hasNewAssignedTasks: boolean;
  addRequest: (request: Omit<WorkflowRequest, 'id' | 'requestId' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>) => Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>>>;
  updateRequestAndNotify: (request: Partial<WorkflowRequest> & { id: string }, notificationMessage?: string, notifyAssigneeMessage?: string | null) => Promise<void>;
  archiveRequestMutation: UseMutationResult<void, Error, string, unknown>;
  markRequestsAsViewedBy: (adminId3a: string, ownedRequestIds: string[]) => Promise<void>;
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflows';
const COUNTER_ID = 'workflowCounter';

export const WorkflowsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { addMessage } = useMessages();
  const { workflowDefinitions } = useApplications();
  const { collaborators } = useCollaborators();
  const { user } = useAuth();


  const { data: requests = [], isFetching } = useQuery<WorkflowRequest[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<WorkflowRequest>(COLLECTION_NAME),
    staleTime: Infinity,
    enabled: !!user,
    select: (data) => data.map(r => ({
        ...r,
        viewedBy: r.viewedBy || []
    })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<WorkflowRequest>(
      COLLECTION_NAME,
      (newData) => {
        const sortedData = newData.map(r => ({
          ...r,
          viewedBy: r.viewedBy || []
        })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        queryClient.setQueryData([COLLECTION_NAME], sortedData);
      },
      (error) => {
        console.error("Failed to listen to workflows collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, user]);

  const hasNewAssignedTasks = useMemo(() => {
    if (!user) return false;
    const currentUserCollab = findCollaboratorByEmail(collaborators, user.email);
    if (!currentUserCollab) return false;

    return requests.some(req => {
      // Check if assigned to current user
      if (req.assignee?.id !== currentUserCollab.id3a) {
        return false;
      }
      // Find the definition to get the initial status
      const definition = workflowDefinitions.find(d => d.name === req.type);
      if (!definition || !definition.statuses || definition.statuses.length === 0) {
        return false;
      }
      const initialStatus = definition.statuses[0].id;
      // Return true if the request is in its initial status
      return req.status === initialStatus;
    });
  }, [requests, user, collaborators, workflowDefinitions]);


  const addRequestMutation = useMutation<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>>, Error, Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee' | 'isArchived' | 'requestId' | 'actionRequests'>>({
    mutationFn: async (requestData) => {
      const definition = workflowDefinitions.find(def => def.name === requestData.type);
      if (!definition) {
        throw new Error(`Definição de workflow para '${requestData.type}' não encontrada.`);
      }
      
      const nextId = await getNextSequentialId(COUNTER_ID);
      const requestId = nextId.toString().padStart(4, '0');
      
      const initialStatus = definition?.statuses?.[0]?.id || 'pending';
      const requestWithDefaults = { 
        ...requestData, 
        requestId,
        status: initialStatus, 
        ownerEmail: definition.ownerEmail,
        viewedBy: [] as string[],
        assignee: undefined,
        isArchived: false,
        actionRequests: {},
      };
      
      if (requestWithDefaults.history[0]) {
        requestWithDefaults.history[0].status = initialStatus;
      }
      
      const newDoc = await addDocumentToCollection(COLLECTION_NAME, requestWithDefaults);

      // --- NOTIFICATION LOGIC ---
      // Sempre envia notificação para o solicitante quando uma nova solicitação é criada
      await addMessage({
          title: `Solicitação Recebida: ${requestData.type} #${requestWithDefaults.requestId}`,
          content: `Sua solicitação '${requestData.type}' foi aberta com sucesso e está pendente de análise.`,
          sender: 'Sistema de Workflows',
          recipientIds: [requestData.submittedBy.userId],
      });

      // Notifica o owner da solicitação (se diferente do solicitante)
      const owner = findCollaboratorByEmail(collaborators, definition.ownerEmail);
      if (owner && owner.id3a !== requestData.submittedBy.userId) {
          await addMessage({
              title: `Nova Solicitação: ${requestData.type} #${requestWithDefaults.requestId}`,
              content: `Uma nova solicitação de '${requestData.type}' foi enviada por ${requestData.submittedBy.userName} e aguarda sua revisão.`,
              sender: 'Sistema de Workflows',
              recipientIds: [owner.id3a],
          });
      }

      // Verifica routing rules apenas se houver formData
      if (definition && definition.routingRules && requestData.formData && Object.keys(requestData.formData).length > 0) {
          for (const rule of definition.routingRules) {
              const formValue = requestData.formData[rule.field];
              if (formValue && formValue.toString().toLowerCase() === rule.value.toLowerCase()) {
                  const recipientUsers = filterCollaboratorsByEmails(collaborators, rule.notify);
                  const recipientIds = recipientUsers.map(u => u.id3a);
                  if (recipientIds.length > 0) {
                      await addMessage({
                          title: `Nova Solicitação para Análise: ${requestData.type}`,
                          content: `Uma nova solicitação de '${requestData.type}' foi aberta por ${requestData.submittedBy.userName} e requer sua atenção devido à regra do campo '${rule.field}' = '${rule.value}'.`,
                          sender: 'Sistema de Workflows',
                          recipientIds: recipientIds,
                      });
                  }
              }
          }
      }

      return { ...newDoc, requestId };
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateRequestMutation = useMutation<void, Error, Partial<WorkflowRequest> & { id: string }>({
    mutationFn: async (updatedRequest) => {
        const { id, ...data } = updatedRequest;
        let payload = { ...data };
        if (payload.status && payload.status !== 'pending') {
            payload = { ...payload, viewedBy: [] };
        }
        
        // --- AUTO-REQUEST ACTION LOGIC ---
        const originalRequest = queryClient.getQueryData<WorkflowRequest[]>([COLLECTION_NAME])?.find(r => r.id === id);
        const definition = workflowDefinitions.find(def => def.name === originalRequest?.type);
        const newStatusDef = definition?.statuses.find(s => s.id === payload.status);

        if (newStatusDef?.action?.approverIds && newStatusDef.action.approverIds.length > 0) {
            const now = new Date();
            const adminUser = findCollaboratorByEmail(collaborators, user?.email);
            
            // Validate approverIds before creating action requests
            const validApprovers = newStatusDef.action.approverIds.map(approverId => 
                collaborators.find(c => c.id3a === approverId)
            ).filter((c): c is WithId<any> => !!c); // Type guard to filter out undefined

            if (validApprovers.length > 0) {
                const newActionRequests = validApprovers.map(approver => ({
                    userId: approver.id3a,
                    userName: approver.name,
                    status: 'pending' as const,
                    requestedAt: formatISO(now),
                    respondedAt: '',
                }));

                // Append to payload
                payload.actionRequests = {
                    ...originalRequest?.actionRequests,
                    [newStatusDef.id]: newActionRequests
                };
                
                if (payload.history && adminUser) {
                  const historyNote = `Ação de "${newStatusDef.action.label}" solicitada automaticamente para ${validApprovers.length} colaborador(es) pré-definido(s).`;
                  payload.history.push({ timestamp: formatISO(now), status: newStatusDef.id, userId: adminUser.id3a, userName: adminUser.name, notes: historyNote });
                }
            }
        }
        
        return updateDocumentInCollection(COLLECTION_NAME, id, payload);
    },
    onSuccess: (data, variables) => {
       queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
});
  
  const archiveRequestMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => updateDocumentInCollection(COLLECTION_NAME, id, { isArchived: true }),
    onSuccess: (data, id) => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    }
  });


  const markRequestsAsViewedBy = useCallback(async (adminId3a: string, ownedRequestIds: string[]) => {
    if (!adminId3a) return;

    const db = getFirestore(getFirebaseApp());
    const batch = writeBatch(db);

    const pendingUnseenRequests = requests.filter(req => 
        req.status === 'pending' && ownedRequestIds.includes(req.id) && !req.viewedBy.includes(adminId3a)
    );

    if (pendingUnseenRequests.length === 0) return;

    pendingUnseenRequests.forEach(req => {
        batch.update(doc(db, COLLECTION_NAME, req.id), { viewedBy: [...req.viewedBy, adminId3a] });
    });

    try {
        await batch.commit();
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    } catch (error) {
        console.error("Failed to mark requests as viewed:", error);
    }
  }, [requests, queryClient]);


  const updateRequestAndNotify = async (requestUpdate: Partial<WorkflowRequest> & { id: string }, notificationMessage?: string, notifyAssigneeMessage: string | null = null) => {
    // #region agent log
    console.log('[DEBUG] updateRequestAndNotify entry - requestUpdate received:', {
      id: requestUpdate.id,
      hasFormData: 'formData' in requestUpdate,
      formDataKeys: requestUpdate.formData ? Object.keys(requestUpdate.formData) : [],
      formDataSize: requestUpdate.formData ? Object.keys(requestUpdate.formData).length : 0,
      formDataFull: requestUpdate.formData
    });
    fetch('http://127.0.0.1:7245/ingest/d51075b1-a735-41d8-b8b9-216099fda8f7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowsContext.tsx:296',message:'updateRequestAndNotify entry - requestUpdate received',data:{requestId:requestUpdate.id,hasFormData:'formData' in requestUpdate,formDataKeys:requestUpdate.formData?Object.keys(requestUpdate.formData):[],formDataSize:requestUpdate.formData?Object.keys(requestUpdate.formData).length:0,formDataPreview:requestUpdate.formData?Object.fromEntries(Object.entries(requestUpdate.formData).slice(0,5)):{}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    try {
      await updateRequestMutation.mutateAsync(requestUpdate);
      // #region agent log
      console.log('[DEBUG] updateRequestMutation.mutateAsync completed successfully');
      // #endregion
    } catch (error) {
      // #region agent log
      console.error('[DEBUG] updateRequestMutation.mutateAsync failed:', error);
      // #endregion
      throw error; // Re-throw para que o erro seja propagado
    }
    
    // CORREÇÃO: Se formData foi passado, verificar se foi realmente salvo (especialmente importante em produção)
    // Isso previne problemas de timing/race condition que podem ocorrer em produção
    if (requestUpdate.formData && Object.keys(requestUpdate.formData).length > 0) {
      // Aguardar um pouco para o Firestore processar a atualização (especialmente importante em produção com latência)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar diretamente do Firestore para verificar se foi salvo
      // Usar Promise.race com timeout para evitar travar indefinidamente
      try {
        const verificationPromise = getDocument<WorkflowRequest>(COLLECTION_NAME, requestUpdate.id);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao verificar formData')), 3000)
        );
        
        const fetchedRequest = await Promise.race([verificationPromise, timeoutPromise]) as WorkflowRequest | null;
        
        if (fetchedRequest) {
          const savedFormDataKeys = fetchedRequest.formData ? Object.keys(fetchedRequest.formData) : [];
          const expectedKeys = Object.keys(requestUpdate.formData);
          // #region agent log
          console.log('[DEBUG] Verificação de formData salvo:', {
            expectedKeys,
            savedKeys: savedFormDataKeys,
            match: savedFormDataKeys.length === expectedKeys.length
          });
          // #endregion
          
          if (savedFormDataKeys.length === 0) {
            // #region agent log
            console.error('[DEBUG] FormData não foi salvo! Tentando novamente...');
            // #endregion
            // Tentar salvar novamente se não foi salvo (pode ter havido problema de timing)
            await updateDocumentInCollection(COLLECTION_NAME, requestUpdate.id, { formData: requestUpdate.formData });
          }
        }
      } catch (verifyError) {
        // #region agent log
        console.error('[DEBUG] Erro ao verificar formData salvo:', verifyError);
        // #endregion
        // Não lançar erro aqui para não bloquear o fluxo, mas logar o problema
        // Em produção, se houver timeout ou erro, o formData já deveria ter sido salvo na primeira tentativa
      }
    }
    
    const originalRequest = requests.find(r => r.id === requestUpdate.id);
    if (!originalRequest) return;
    
    const definition = workflowDefinitions.find(def => def.name === originalRequest.type);
    const isFinalStatus = definition?.statuses.some(s => s.id === requestUpdate.status && ['finalizado', 'concluído', 'aprovado', 'reprovado', 'cancelado'].some(term => s.label.toLowerCase().includes(term))) ?? false;

    // Always notify the requester (submittedBy)
    if (notificationMessage && originalRequest.submittedBy.userId) {
        await addMessage({
            title: `Atualização: ${originalRequest.type} #${originalRequest.requestId}`,
            content: notificationMessage,
            sender: 'Sistema de Workflows',
            recipientIds: [originalRequest.submittedBy.userId],
        });
    }

    // Only notify the assignee if it's NOT the final status
    if (notifyAssigneeMessage && requestUpdate.assignee?.id && !isFinalStatus) {
       await addMessage({
            title: `Nova Tarefa Atribuída: ${originalRequest.type} #${originalRequest.requestId}`,
            content: notifyAssigneeMessage,
            sender: 'Sistema de Workflows',
            recipientIds: [requestUpdate.assignee.id],
        });
    }
  };
  
  const value = useMemo(() => ({
    requests,
    loading: isFetching,
    hasNewAssignedTasks,
    addRequest: (request: Omit<WorkflowRequest, 'id' | 'requestId' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>) => addRequestMutation.mutateAsync(request) as Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>>>,
    updateRequestAndNotify,
    archiveRequestMutation,
    markRequestsAsViewedBy
  }), [requests, isFetching, hasNewAssignedTasks, addRequestMutation, updateRequestAndNotify, archiveRequestMutation, markRequestsAsViewedBy]);

  return (
    <WorkflowsContext.Provider value={value}>
      {children}
    </WorkflowsContext.Provider>
  );
};

export const useWorkflows = (): WorkflowsContextType => {
  const context = useContext(WorkflowsContext);
  if (context === undefined) {
    throw new Error('useWorkflows must be used within a WorkflowsProvider');
  }
  return context;
};
