
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { useMessages } from './MessagesContext';
import { useApplications } from './ApplicationsContext';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';
import { useCollaborators } from './CollaboratorsContext';

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

// Define a estrutura principal de uma solicitação de workflow
export interface WorkflowRequest {
  id: string;
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
}

interface WorkflowsContextType {
  requests: WorkflowRequest[];
  loading: boolean;
  addRequest: (request: Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>) => Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>>>;
  updateRequestAndNotify: (request: Partial<WorkflowRequest> & { id: string }, notificationMessage: string, notifyAssigneeMessage?: string | null) => Promise<void>;
  deleteRequestMutation: UseMutationResult<void, Error, string, unknown>;
  markRequestsAsViewedBy: (adminId3a: string, ownedRequestIds: string[]) => Promise<void>;
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflows';

export const WorkflowsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { addMessage } = useMessages();
  const { workflowDefinitions } = useApplications();
  const { collaborators } = useCollaborators();


  const { data: requests = [], isFetching } = useQuery<WorkflowRequest[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<WorkflowRequest>(COLLECTION_NAME),
    // Ordenar por data de submissão mais recente
    select: (data) => data.map(r => ({
        ...r,
        viewedBy: r.viewedBy || []
    })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  const addRequestMutation = useMutation<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>>, Error, Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>>({
    mutationFn: async (requestData) => {
      const definition = workflowDefinitions.find(def => def.name === requestData.type);
      if (!definition) {
        throw new Error(`Definição de workflow para '${requestData.type}' não encontrada.`);
      }
      
      const initialStatus = definition?.statuses?.[0]?.id || 'pending';
      const requestWithDefaults = { 
        ...requestData, 
        status: initialStatus, 
        ownerEmail: definition.ownerEmail,
        viewedBy: [] as string[],
        assignee: undefined,
      };
      
      if (requestWithDefaults.history[0]) {
        requestWithDefaults.history[0].status = initialStatus;
      }
      
      const newDoc = await addDocumentToCollection(COLLECTION_NAME, requestWithDefaults);

      // --- NOTIFICATION LOGIC ---
      // 1. Notify requester
      await addMessage({
          title: `Solicitação Recebida: ${requestData.type}`,
          content: `Sua solicitação '${requestData.type}' foi aberta com sucesso e está pendente de análise.`,
          sender: 'Sistema de Workflows',
          recipientIds: [requestData.submittedBy.userId],
      });

      // 2. Notify the workflow owner
      const owner = collaborators.find(c => c.email === definition.ownerEmail);
      if (owner) {
          await addMessage({
              title: `Nova Solicitação: ${requestData.type}`,
              content: `Uma nova solicitação de '${requestData.type}' foi enviada por ${requestData.submittedBy.userName} e aguarda sua revisão.`,
              sender: 'Sistema de Workflows',
              recipientIds: [owner.id3a],
          });
      }


      // 3. Notify based on routing rules
      if (definition && definition.routingRules) {
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

      return newDoc as WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>>;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateRequestMutation = useMutation<void, Error, Partial<WorkflowRequest> & { id: string }>({
    mutationFn: (updatedRequest) => {
      const { id, ...data } = updatedRequest;
      const payload = { ...data };
      if (payload.status && payload.status !== 'pending') {
          payload.viewedBy = [];
      }
      
      return updateDocumentInCollection(COLLECTION_NAME, id, payload);
    },
    onSuccess: (data, variables) => {
        queryClient.setQueryData<WorkflowRequest[]>([COLLECTION_NAME], (oldData) => {
            if (!oldData) return [];
            return oldData.map(req => 
                req.id === variables.id ? { ...req, ...variables } : req
            );
        });
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const deleteRequestMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: (data, id) => {
        queryClient.setQueryData<WorkflowRequest[]>([COLLECTION_NAME], (oldData) => {
            if (!oldData) return [];
            return oldData.filter(req => req.id !== id);
        });
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

    const locallyUpdatedRequests = requests.map(req => {
        if (pendingUnseenRequests.some(pr => pr.id === req.id)) {
            batch.update(doc(db, COLLECTION_NAME, req.id), { viewedBy: [...req.viewedBy, adminId3a] });
            return { ...req, viewedBy: [...req.viewedBy, adminId3a] };
        }
        return req;
    });

    queryClient.setQueryData([COLLECTION_NAME], locallyUpdatedRequests);

    try {
        await batch.commit();
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    } catch (error) {
        console.error("Failed to mark requests as viewed:", error);
        queryClient.setQueryData([COLLECTION_NAME], requests);
    }
  }, [requests, queryClient]);


  const updateRequestAndNotify = async (requestUpdate: Partial<WorkflowRequest> & { id: string }, notificationMessage: string, notifyAssigneeMessage: string | null = null) => {
    await updateRequestMutation.mutateAsync(requestUpdate);
    
    const originalRequest = requests.find(r => r.id === requestUpdate.id);
    if (!originalRequest) return;

    if (originalRequest.submittedBy.userId) {
        await addMessage({
            title: `Atualização: ${originalRequest.type}`,
            content: notificationMessage,
            sender: 'Sistema de Workflows',
            recipientIds: [originalRequest.submittedBy.userId],
        });
    }

    if (notifyAssigneeMessage && requestUpdate.assignee?.id) {
       await addMessage({
            title: `Nova Tarefa Atribuída: ${originalRequest.type}`,
            content: notifyAssigneeMessage,
            sender: 'Sistema de Workflows',
            recipientIds: [requestUpdate.assignee.id],
        });
    }
  };
  
  const value = useMemo(() => ({
    requests,
    loading: isFetching,
    addRequest: (request) => addRequestMutation.mutateAsync(request) as Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy' | 'assignee'>>>,
    updateRequestAndNotify,
    deleteRequestMutation,
    markRequestsAsViewedBy
  }), [requests, isFetching, addRequestMutation, updateRequestAndNotify, deleteRequestMutation, markRequestsAsViewedBy]);

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
