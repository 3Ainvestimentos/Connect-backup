
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

// Define os possíveis status de um workflow
export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

// Define o registro do histórico para auditoria
export interface WorkflowHistoryLog {
  timestamp: string; // ISO String
  status: WorkflowStatus;
  userId: string; // ID do usuário que realizou a ação
  userName: string;
  notes?: string;
}

// Define a estrutura principal de uma solicitação de workflow
export interface WorkflowRequest {
  id: string;
  type: string; // Ex: 'vacation_request', 'reimbursement'
  status: WorkflowStatus;
  submittedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  submittedAt: string; // ISO String
  lastUpdatedAt: string; // ISO String
  formData: Record<string, any>; // Objeto flexível para os dados do formulário
  history: WorkflowHistoryLog[];
  currentApprover?: {
      userId: string;
      userName: string;
  };
}

interface WorkflowsContextType {
  requests: WorkflowRequest[];
  loading: boolean;
  addRequest: (request: Omit<WorkflowRequest, 'id'>) => Promise<WithId<Omit<WorkflowRequest, 'id'>>>;
  updateRequest: (request: Partial<WorkflowRequest> & { id: string }) => Promise<void>;
  deleteRequestMutation: UseMutationResult<void, Error, string, unknown>;
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflows';

export const WorkflowsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: requests = [], isFetching } = useQuery<WorkflowRequest[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<WorkflowRequest>(COLLECTION_NAME),
    // Ordenar por data de submissão mais recente
    select: (data) => data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });

  const addRequestMutation = useMutation<WithId<Omit<WorkflowRequest, 'id'>>, Error, Omit<WorkflowRequest, 'id'>>({
    mutationFn: (requestData) => addDocumentToCollection(COLLECTION_NAME, requestData),
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
    updateRequest: (request) => updateRequestMutation.mutateAsync(request),
    deleteRequestMutation,
  }), [requests, isFetching, addRequestMutation, updateRequestMutation, deleteRequestMutation]);

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
