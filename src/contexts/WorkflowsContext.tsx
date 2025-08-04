
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, getNextSequentialId, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useMessages } from './MessagesContext';
import { useApplications } from './ApplicationsContext';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';
import { useCollaborators } from './CollaboratorsContext';
import { useAuth } from './AuthContext';
import { formatISO } from 'date-fns';

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
    select: (data) => data.map(r => ({
        ...r,
        viewedBy: r.viewedBy || []
    })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  React.useEffect(() => {
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
  }, [queryClient]);

  const hasNewAssignedTasks = useMemo(() => {
    if (!user) return false;
    const currentUserCollab = collaborators.find(c => c.email === user.email);
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
      if (Object.keys(requestData.formData).length === 0) { 
            await addMessage({
                title: `Solicitação Recebida: ${requestData.type} #${requestWithDefaults.requestId}`,
                content: `Sua solicitação '${requestData.type}' foi aberta com sucesso e está pendente de análise.`,
                sender: 'Sistema de Workflows',
                recipientIds: [requestData.submittedBy.userId],
            });

            const owner = collaborators.find(c => c.email === definition.ownerEmail);
            if (owner && owner.id3a !== requestData.submittedBy.userId) {
                await addMessage({
                    title: `Nova Solicitação: ${requestData.type} #${requestWithDefaults.requestId}`,
                    content: `Uma nova solicitação de '${requestData.type}' foi enviada por ${requestData.submittedBy.userName} e aguarda sua revisão.`,
                    sender: 'Sistema de Workflows',
                    recipientIds: [owner.id3a],
                });
            }

            if (definition && definition.routingRules && requestData.formData) {
                for (const rule of definition.routingRules) {
                const formValue = requestData.formData[rule.field];
                if (formValue && formValue.toString().toLowerCase() === rule.value.toLowerCase()) {
                    const recipientUsers = collaborators.filter(c => rule.notify.includes(c.email));
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
      }

      return { ...newDoc, requestId };
    },
    onSuccess: () => {
        // Invalidation not needed due to listener
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
            const adminUser = collaborators.find(c => c.email === user?.email);
            const historyNote = `Ação de "${newStatusDef.action.label}" solicitada automaticamente para ${newStatusDef.action.approverIds.length} colaborador(es) pré-definido(s).`;
            
            const newActionRequests = newStatusDef.action.approverIds.map(approverId => {
                const approver = collaborators.find(c => c.id3a === approverId);
                return {
                    userId: approverId,
                    userName: approver?.name || 'Desconhecido',
                    status: 'pending' as const,
                    requestedAt: formatISO(now),
                    respondedAt: '',
                };
            });

            // Append to payload
            payload.actionRequests = {
                ...originalRequest?.actionRequests,
                [newStatusDef.id]: newActionRequests
            };
            if (payload.history && adminUser) {
              payload.history.push({ timestamp: formatISO(now), status: newStatusDef.id, userId: adminUser.id3a, userName: adminUser.name, notes: historyNote });
            }
        }
        
        return updateDocumentInCollection(COLLECTION_NAME, id, payload);
    },
    onSuccess: (data, variables) => {
       // Listener handles update
    },
});
  
  const archiveRequestMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => updateDocumentInCollection(COLLECTION_NAME, id, { isArchived: true }),
    onSuccess: (data, id) => {
        // Listener handles update
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
        // Listener will handle the updates in the UI
    } catch (error) {
        console.error("Failed to mark requests as viewed:", error);
        // If the batch fails, React Query will not have been updated, so no rollback needed.
    }
  }, [requests, queryClient]);


  const updateRequestAndNotify = async (requestUpdate: Partial<WorkflowRequest> & { id: string }, notificationMessage?: string, notifyAssigneeMessage: string | null = null) => {
    await updateRequestMutation.mutateAsync(requestUpdate);
    
    const originalRequest = requests.find(r => r.id === requestUpdate.id);
    if (!originalRequest) return;
    
    const definition = workflowDefinitions.find(def => def.name === originalRequest.type);
    const isFinalStatus = definition ? definition.statuses[definition.statuses.length - 1]?.id === requestUpdate.status : false;

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
    addRequest: (request) => addRequestMutation.mutateAsync(request) as Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee' | 'isArchived' | 'actionRequests'>>>,
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
