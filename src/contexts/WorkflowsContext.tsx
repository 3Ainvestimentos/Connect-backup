
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { useMessages } from './MessagesContext';
import { useApplications } from './ApplicationsContext';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';

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
  addRequest: (request: Omit<WorkflowRequest, 'id' | 'viewedBy'>) => Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy'>>>;
  updateRequestAndNotify: (request: Partial<WorkflowRequest> & { id: string }, notificationMessage: string) => Promise<void>;
  deleteRequestMutation: UseMutationResult<void, Error, string, unknown>;
  markRequestsAsViewedBy: (adminId3a: string) => Promise<void>;
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflows';

export const WorkflowsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { addMessage } = useMessages();
  const { workflowDefinitions } = useApplications();

  const { data: requests = [], isFetching } = useQuery<WorkflowRequest[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<WorkflowRequest>(COLLECTION_NAME),
    // Ordenar por data de submissão mais recente
    select: (data) => data.map(r => ({
        ...r,
        viewedBy: r.viewedBy || []
    })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  const addRequestMutation = useMutation<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy'>>, Error, Omit<WorkflowRequest, 'id' | 'viewedBy'>>({
    mutationFn: async (requestData) => {
      const definition = workflowDefinitions.find(def => def.name === requestData.type);
      const notificationsToSend: { recipient: string; value: string; field: string}[] = [];

      if (definition && definition.routingRules) {
        for (const rule of definition.routingRules) {
          const formValue = requestData.formData[rule.field];
          if (formValue && formValue.toString().toLowerCase() === rule.value.toLowerCase()) {
            rule.notify.forEach(recipient => {
                notificationsToSend.push({ recipient, value: formValue, field: rule.field });
            });
          }
        }
      }
      
      // For now, we just log this. In a real scenario, we'd trigger an email/notification service here.
      if (notificationsToSend.length > 0) {
          console.log("Routing Rules Matched. Would send notifications:", notificationsToSend);
      }

      // Set initial status from definition
      const initialStatus = definition?.statuses?.[0]?.id || 'pending';
      const requestWithInitialStatus = { ...requestData, status: initialStatus, viewedBy: [] as string[] };
      if (requestWithInitialStatus.history[0]) {
        requestWithInitialStatus.history[0].status = initialStatus;
      }

      return addDocumentToCollection(COLLECTION_NAME, requestWithInitialStatus);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateRequestMutation = useMutation<void, Error, Partial<WorkflowRequest> & { id: string }>({
    mutationFn: (updatedRequest) => {
      const { id, ...data } = updatedRequest;
      // When status is no longer pending, clear the viewedBy list
      const payload = { ...data };
      if (payload.status && payload.status !== 'pending') {
          payload.viewedBy = [];
      }
      
      return updateDocumentInCollection(COLLECTION_NAME, id, payload);
    },
    onSuccess: (data, variables) => {
        // Optimistically update the local cache to reflect the change immediately
        queryClient.setQueryData<WorkflowRequest[]>([COLLECTION_NAME], (oldData) => {
            if (!oldData) return [];
            return oldData.map(req => 
                req.id === variables.id ? { ...req, ...variables } : req
            );
        });
        // Invalidate to refetch and ensure consistency
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


  const markRequestsAsViewedBy = useCallback(async (adminId3a: string) => {
    if (!adminId3a) return;

    const db = getFirestore(getFirebaseApp());
    const batch = writeBatch(db);

    const pendingUnseenRequests = requests.filter(req => 
        req.status === 'pending' && !req.viewedBy.includes(adminId3a)
    );

    if (pendingUnseenRequests.length === 0) return;

    const locallyUpdatedRequests = requests.map(req => {
        if (pendingUnseenRequests.some(pr => pr.id === req.id)) {
            batch.update(doc(db, COLLECTION_NAME, req.id), { viewedBy: [...req.viewedBy, adminId3a] });
            return { ...req, viewedBy: [...req.viewedBy, adminId3a] };
        }
        return req;
    });

    // Optimistically update the cache
    queryClient.setQueryData([COLLECTION_NAME], locallyUpdatedRequests);

    try {
        await batch.commit();
        // Invalidate to be sure, but UI should be fast
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    } catch (error) {
        console.error("Failed to mark requests as viewed:", error);
        // If error, revert optimistic update
        queryClient.setQueryData([COLLECTION_NAME], requests);
    }
  }, [requests, queryClient]);


  const updateRequestAndNotify = async (requestUpdate: Partial<WorkflowRequest> & { id: string }, notificationMessage: string) => {
    // First, update the request in Firestore
    await updateRequestMutation.mutateAsync(requestUpdate);
    
    // Then, find the original request to get the submitter's ID
    const originalRequest = requests.find(r => r.id === requestUpdate.id);
    if (originalRequest && originalRequest.submittedBy.userId) {
        await addMessage({
            title: `Atualização: ${originalRequest.type}`,
            content: notificationMessage,
            sender: 'Sistema de Workflows',
            recipientIds: [originalRequest.submittedBy.userId], // Send only to the user who made the request
        });
    }
  };
  
  const value = useMemo(() => ({
    requests,
    loading: isFetching,
    addRequest: (request) => addRequestMutation.mutateAsync(request) as Promise<WithId<Omit<WorkflowRequest, 'id' | 'viewedBy'>>>,
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
