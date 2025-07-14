
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

// Represents a single status in a workflow lifecycle
export interface WorkflowStatusDefinition {
  id: string; // e.g., 'pending_approval'
  label: string; // e.g., 'Pendente de Aprovação'
}

// Represents a workflow definition, which dictates the structure of a form.
export interface FormFieldDefinition {
  id: string; // Unique ID for the field within the form
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For 'select' type
}

export interface RoutingRule {
  field: string; // id of the field to check
  value: string; // value to match
  notify: string[]; // array of emails to notify
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: FormFieldDefinition[];
  routingRules: RoutingRule[];
  statuses: WorkflowStatusDefinition[]; // Custom statuses for this workflow
}

interface ApplicationsContextType {
  workflowDefinitions: WorkflowDefinition[];
  loading: boolean;
  addWorkflowDefinition: (definition: Omit<WorkflowDefinition, 'id'>) => Promise<WorkflowDefinition>;
  updateWorkflowDefinition: (definition: WorkflowDefinition) => Promise<void>;
  deleteWorkflowDefinitionMutation: UseMutationResult<void, Error, string, unknown>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflowDefinitions';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: workflowDefinitions = [], isFetching } = useQuery<WorkflowDefinition[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<WorkflowDefinition>(COLLECTION_NAME),
    // Ensure fields, routingRules, and statuses are always arrays
    select: (data) => data.map(d => ({ 
      ...d, 
      fields: d.fields || [], 
      routingRules: d.routingRules || [],
      statuses: d.statuses || [],
    })),
  });

  const addWorkflowDefinitionMutation = useMutation<WithId<Omit<WorkflowDefinition, 'id'>>, Error, Omit<WorkflowDefinition, 'id'>>({
    mutationFn: (definitionData) => addDocumentToCollection(COLLECTION_NAME, definitionData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateWorkflowDefinitionMutation = useMutation<void, Error, WorkflowDefinition>({
    mutationFn: (updatedDefinition) => {
      const { id, ...data } = updatedDefinition;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME, variables.id] });
    },
  });

  const deleteWorkflowDefinitionMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const value = useMemo(() => ({
    workflowDefinitions,
    loading: isFetching,
    addWorkflowDefinition: (definition) => addWorkflowDefinitionMutation.mutateAsync(definition) as Promise<WorkflowDefinition>,
    updateWorkflowDefinition: (definition) => updateWorkflowDefinitionMutation.mutateAsync(definition),
    deleteWorkflowDefinitionMutation,
  }), [workflowDefinitions, isFetching, addWorkflowDefinitionMutation, updateWorkflowDefinitionMutation, deleteWorkflowDefinitionMutation]);

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
};

export const useApplications = (): ApplicationsContextType => {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
};
