
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection } from '@/lib/firestore-service';
import * as z from 'zod';

const workflowActionSchema = z.object({
  type: z.enum(['approval', 'acknowledgement']),
  label: z.string().min(1, "O rótulo da ação é obrigatório."),
  approverIds: z.array(z.string()).optional(), // Optional: pre-defined approvers
});

// Represents a single status in a workflow lifecycle
export interface WorkflowStatusDefinition {
  id: string; // e.g., 'pending_approval'
  label: string; // e.g., 'Pendente de Aprovação'
  action?: z.infer<typeof workflowActionSchema>;
}
export const workflowStatusSchema = z.object({
  id: z.string().min(1, "ID do status é obrigatório.").regex(/^[a-z0-9_]+$/, "ID deve conter apenas letras minúsculas, números e underscores."),
  label: z.string().min(1, "Label é obrigatório."),
  action: workflowActionSchema.optional(),
});


// Represents a workflow definition, which dictates the structure of a form.
export interface FormFieldDefinition {
  id: string; // Unique ID for the field within the form
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For 'select' type
}
export const formFieldSchema = z.object({
  id: z.string().min(1, "ID do campo é obrigatório.").regex(/^[a-z0-9_]+$/, "ID deve conter apenas letras minúsculas, números e underscores."),
  label: z.string().min(1, "Label é obrigatório."),
  type: z.enum(['text', 'textarea', 'select', 'date', 'date-range', 'file']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.union([z.string(), z.array(z.string())]).optional(),
});

export const routingRuleSchema = z.object({
  field: z.string().min(1, "Campo é obrigatório."),
  value: z.string().min(1, "Valor é obrigatório."),
  notify: z.union([z.string(), z.array(z.string().email())])
    .transform(val => {
        if (Array.isArray(val)) return val;
        return val.split(',').map(s => s.trim()).filter(Boolean);
    })
    .refine(emails => emails.length > 0, { message: "Pelo menos um e-mail é obrigatório para notificação." })
    .refine(emails => emails.every(email => z.string().email().safeParse(email).success), { message: "Um ou mais e-mails de notificação são inválidos." }),
});
export type RoutingRule = z.infer<typeof routingRuleSchema>;

export const slaRuleSchema = z.object({
  field: z.string().min(1, "O campo para a regra de SLA é obrigatório."),
  value: z.string().min(1, "O valor para a regra de SLA é obrigatório."),
  days: z.coerce.number().min(0, "O SLA em dias deve ser um número positivo.").transform(val => Math.round(val)),
});

export const workflowDefinitionSchema = z.object({
    name: z.string().min(1, "Nome da definição é obrigatório."),
    description: z.string().min(1, "Descrição é obrigatória."),
    icon: z.string().min(1, "Ícone é obrigatório."),
    areaId: z.string().min(1, "A área do workflow é obrigatória."),
    ownerEmail: z.string().email("O e-mail do proprietário é obrigatório."),
    slaRules: z.array(slaRuleSchema).optional().default([]),
    defaultSlaDays: z.coerce.number().min(0, "SLA padrão não pode ser negativo.").optional(),
    fields: z.array(formFieldSchema),
    routingRules: z.array(routingRuleSchema).optional().default([]),
    statuses: z.array(workflowStatusSchema).min(1, "Pelo menos um status é necessário."),
    allowedUserIds: z.array(z.string()).min(1, "Pelo menos um destinatário deve ser selecionado (ou 'todos').").optional().default(['all']),
});

export type SlaRule = z.infer<typeof slaRuleSchema>;
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

    const queryFn = () => new Promise<WithId<WorkflowDefinition>[]>((resolve, reject) => {
        const unsubscribe = listenToCollection<WorkflowDefinition>(
            COLLECTION_NAME,
            (data) => resolve(data), // Resolve with the first batch of data
            (error) => reject(error)
        );
        // This won't unsubscribe in this promise structure, but it's a way to get queryFn to work.
        // A better approach would use queryClient.setQueryData inside the onData callback. Let's try that.
    });
    
  const { data: workflowDefinitions = [], isFetching } = useQuery<WorkflowDefinition[]>({
    queryKey: [COLLECTION_NAME],
    // The query function is now just a placeholder. The real work is done in the effect below.
    queryFn: async () => {
        // We still need to return a promise that resolves to the initial data,
        // otherwise the query remains in a 'loading' state.
        // Let's use getCollection for the initial fetch for simplicity within useQuery.
        // The listener will then provide the real-time updates.
        // This is a common pattern.
        return [];
    },
    staleTime: Infinity, // The listener will handle updates, so we don't need react-query to refetch.
    // Ensure fields, routingRules, and statuses are always arrays
    select: (data) => data.map(d => ({ 
      ...d, 
      fields: d.fields || [], 
      routingRules: d.routingRules || [],
      statuses: d.statuses || [],
      slaRules: d.slaRules || [],
      allowedUserIds: d.allowedUserIds || ['all'],
    })),
  });
  
    // Effect to set up the real-time listener
    React.useEffect(() => {
        const unsubscribe = listenToCollection<WorkflowDefinition>(
            COLLECTION_NAME,
            (newData) => {
                // When new data arrives, update the query cache.
                queryClient.setQueryData([COLLECTION_NAME], newData);
            },
            (error) => {
                console.error(error);
            }
        );
        // Detach the listener when the component unmounts.
        return () => unsubscribe();
    }, [queryClient]);

  const addWorkflowDefinitionMutation = useMutation<WithId<Omit<WorkflowDefinition, 'id'>>, Error, Omit<WorkflowDefinition, 'id'>>({
    mutationFn: (definitionData) => addDocumentToCollection(COLLECTION_NAME, definitionData),
    onSuccess: () => {
        // Invalidation is not strictly needed due to the listener, but it's good practice.
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateWorkflowDefinitionMutation = useMutation<void, Error, WorkflowDefinition>({
    mutationFn: (updatedDefinition) => {
      const { id, ...data } = updatedDefinition;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: (_, variables) => {
        // No need to invalidate, listener will catch the update.
    },
  });

  const deleteWorkflowDefinitionMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      // No need to invalidate, listener will catch the update.
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
