
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import * as z from 'zod';

export const workflowAreaSchema = z.object({
    name: z.string().min(1, "O nome da área é obrigatório."),
    icon: z.string().min(1, "O ícone é obrigatório."),
    storageFolderPath: z.string().min(1, "O caminho da pasta no Storage é obrigatório."), // ex: "financeiro/reembolsos"
});

export type WorkflowArea = WithId<z.infer<typeof workflowAreaSchema>>;

interface WorkflowAreasContextType {
    workflowAreas: WorkflowArea[];
    loading: boolean;
    addWorkflowArea: (area: Omit<WorkflowArea, 'id'>) => Promise<WorkflowArea>;
    updateWorkflowArea: (area: WorkflowArea) => Promise<void>;
    deleteWorkflowAreaMutation: UseMutationResult<void, Error, string, unknown>;
}

const WorkflowAreasContext = createContext<WorkflowAreasContextType | undefined>(undefined);
const COLLECTION_NAME = 'workflowAreas';

export const WorkflowAreasProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();

    const { data: workflowAreas = [], isFetching } = useQuery<WorkflowArea[]>({
        queryKey: [COLLECTION_NAME],
        // Fetch the initial data from Firestore
        queryFn: () => getCollection<WorkflowArea>(COLLECTION_NAME),
        staleTime: Infinity, // The listener will keep it fresh
        select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)),
    });

    React.useEffect(() => {
        const unsubscribe = listenToCollection<WorkflowArea>(
            COLLECTION_NAME,
            (newData) => {
                const sortedData = newData.sort((a, b) => a.name.localeCompare(b.name));
                queryClient.setQueryData([COLLECTION_NAME], sortedData);
            },
            (error) => {
                console.error("Failed to listen to workflow areas collection:", error);
            }
        );
        return () => unsubscribe();
    }, [queryClient]);

    const addWorkflowAreaMutation = useMutation<WithId<Omit<WorkflowArea, 'id'>>, Error, Omit<WorkflowArea, 'id'>>({
        mutationFn: (areaData) => addDocumentToCollection(COLLECTION_NAME, areaData),
        onSuccess: () => {
            // Listener handles the update, no need to invalidate
        },
    });

    const updateWorkflowAreaMutation = useMutation<void, Error, WorkflowArea>({
        mutationFn: (updatedArea) => {
            const { id, ...data } = updatedArea;
            return updateDocumentInCollection(COLLECTION_NAME, id, data);
        },
        onSuccess: (_, variables) => {
             // Listener handles the update, no need to invalidate
        },
    });

    const deleteWorkflowAreaMutation = useMutation<void, Error, string>({
        mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
        onSuccess: () => {
             // Listener handles the update, no need to invalidate
        },
    });

    const value = useMemo(() => ({
        workflowAreas,
        loading: isFetching,
        addWorkflowArea: (area) => addWorkflowAreaMutation.mutateAsync(area) as Promise<WorkflowArea>,
        updateWorkflowArea: (area) => updateWorkflowAreaMutation.mutateAsync(area),
        deleteWorkflowAreaMutation,
    }), [workflowAreas, isFetching, addWorkflowAreaMutation, updateWorkflowAreaMutation, deleteWorkflowAreaMutation]);

    return (
        <WorkflowAreasContext.Provider value={value}>
            {children}
        </WorkflowAreasContext.Provider>
    );
};

export const useWorkflowAreas = (): WorkflowAreasContextType => {
    const context = useContext(WorkflowAreasContext);
    if (context === undefined) {
        throw new Error('useWorkflowAreas must be used within a WorkflowAreasProvider');
    }
    return context;
};
