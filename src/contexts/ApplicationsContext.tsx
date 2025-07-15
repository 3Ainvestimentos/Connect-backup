
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import * as z from 'zod';

// Represents a single status in a workflow lifecycle
export interface WorkflowStatusDefinition {
  id: string; // e.g., 'pending_approval'
  label: string; // e.g., 'Pendente de Aprovação'
}
export const workflowStatusSchema = z.object({
  id: z.string().min(1, "ID do status é obrigatório.").regex(/^[a-z0-9_]+$/, "ID deve conter apenas letras minúsculas, números e underscores."),
  label: z.string().min(1, "Label é obrigatório."),
});


// Represents a workflow definition, which dictates the structure of a form.
export interface FormFieldDefinition {
  id: string; // Unique ID for the field within the form
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For 'select' type
}
export const formFieldSchema = z.object({
  id: z.string().min(1, "ID do campo é obrigatório.").regex(/^[a-zA-Z0-9_]+$/, "ID deve conter apenas letras, números e underscores."),
  label: z.string().min(1, "Label é obrigatório."),
  type: z.enum(['text', 'textarea', 'select', 'date', 'date-range']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // Changed to array of strings
});

export interface RoutingRule {
  field: string; // id of the field to check
  value: string; // value to match
  notify: string[]; // array of emails to notify
}
export const routingRuleSchema = z.object({
  field: z.string().min(1, "Campo é obrigatório."),
  value: z.string().min(1, "Valor é obrigatório."),
  notify: z.array(z.string().email("Um ou mais e-mails de notificação são inválidos.")).min(1, "Pelo menos um e-mail é obrigatório para notificação."),
});

export const workflowDefinitionSchema = z.object({
    name: z.string().min(1, "Nome da definição é obrigatório."),
    description: z.string().min(1, "Descrição é obrigatória."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    slaDays: z.number().int().min(0, "SLA não pode ser negativo.").optional(),
    fields: z.array(formFieldSchema),
    routingRules: z.array(routingRuleSchema).optional().default([]),
    statuses: z.array(workflowStatusSchema).min(1, "Pelo menos um status é necessário."),
});

export type WorkflowDefinition = WithId<z.infer<typeof workflowDefinitionSchema>>;


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
