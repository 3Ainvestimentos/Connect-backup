
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { useMessages } from './MessagesContext';
import { useApplications } from './ApplicationsContext';

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
}

interface WorkflowsContextType {
  requests: WorkflowRequest[];
  loading: boolean;
  addRequest: (request: Omit<WorkflowRequest, 'id'>) => Promise<WithId<Omit<WorkflowRequest, 'id'>>>;
  updateRequestAndNotify: (request: Partial<WorkflowRequest> & { id: string }, notificationMessage: string) => Promise<void>;
  deleteRequestMutation: UseMutationResult<void, Error, string, unknown>;
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
    select: (data) => data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  const addRequestMutation = useMutation<WithId<Omit<WorkflowRequest, 'id'>>, Error, Omit<WorkflowRequest, 'id'>>({
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
      const requestWithInitialStatus = { ...requestData, status: initialStatus };
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
      // Ensure we only pass valid fields to Firestore by cleaning the object.
      // This is especially important for the 'history' array.
      const updatePayload = {
        ...data,
        history: data.history?.map(log => ({...log})) // ensure history is a plain object
      }
      return updateDocumentInCollection(COLLECTION_NAME, id, updatePayload);
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

  const deleteRequestMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const value = useMemo(() => ({
    requests,
    loading: isFetching,
    addRequest: (request) => addRequestMutation.mutateAsync(request),
    updateRequestAndNotify,
    deleteRequestMutation,
  }), [requests, isFetching, addRequestMutation, deleteRequestMutation, updateRequestAndNotify]);

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
