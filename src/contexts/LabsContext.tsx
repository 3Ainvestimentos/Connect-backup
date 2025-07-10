
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Using the mock service instead of the real Firestore service
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/mock-firestore-service';

export interface LabType {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  lastModified: string;
  videoUrl: string;
}

// Initial mock data to populate localStorage if it's empty
const mockLabs: LabType[] = [
    { id: "lab_mock_1", title: "Treinamento Onboarding", subtitle: "Parte 1", category: "Integração", lastModified: "2024-07-26", videoUrl: "https://drive.google.com/file/d/1Ic8JAuB_QNwG7wp4Yrw8PQui4086Gs9A/view" },
    { id: "lab_mock_2", title: "Cultura Organizacional", subtitle: "Valores e Missão", category: "Institucional", lastModified: "2024-07-26", videoUrl: "https://drive.google.com/file/d/1OtAD5ieAgs6ppxuWCChuLrqNpQExjln0/view" },
    { id: "lab_mock_3", title: "Ferramentas Internas", subtitle: "Visão Geral", category: "Ferramentas", lastModified: "2024-07-25", videoUrl: "https://drive.google.com/file/d/1SHV3zJNdejwSO0BhLwNyKozxv8ZEUeGo/view" },
    { id: "lab_mock_4", title: "Políticas de Segurança", subtitle: "Boas Práticas", category: "Segurança", lastModified: "2024-07-25", videoUrl: "https://drive.google.com/file/d/12Q1gS_faJpw7jYRBsRyHqyikEvVv6-hF/view" },
    { id: "lab_mock_5", title: "Comunicação Eficaz", subtitle: "Técnicas", category: "Desenvolvimento", lastModified: "2024-07-24", videoUrl: "https://drive.google.com/file/d/1gJ4qrl7Pl5hlhkWmx03ZZAgyDdcphMDE/view" },
    { id: "lab_mock_6", title: "Gestão de Projetos", subtitle: "Metodologia Ágil", category: "Projetos", lastModified: "2024-07-24", videoUrl: "https://drive.google.com/file/d/1uUUhjQ4FwDBMAluwFPzSSEce4xm81gQ0/view" },
    { id: "lab_mock_7", title: "Feedback Construtivo", subtitle: "Como aplicar", category: "Liderança", lastModified: "2024-07-23", videoUrl: "https://drive.google.com/file/d/1cqTusqhlRw4laV1zdeBYlM8ja93l7hfE/view" },
];

interface LabsContextType {
  labs: LabType[];
  loading: boolean;
  addLab: (lab: Omit<LabType, 'id'>) => Promise<WithId<Omit<LabType, 'id'>>>;
  updateLab: (lab: LabType) => Promise<void>;
  deleteLab: (id: string) => Promise<void>;
}

const LabsContext = createContext<LabsContextType | undefined>(undefined);
const COLLECTION_NAME = 'labs';

export const LabsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: labs = [], isFetching } = useQuery<LabType[]>({
    queryKey: [COLLECTION_NAME],
    // Pass mock data to initialize if localStorage is empty
    queryFn: () => getCollection<LabType>(COLLECTION_NAME, mockLabs),
  });

  const addLabMutation = useMutation<WithId<Omit<LabType, 'id'>>, Error, Omit<LabType, 'id'>>({
    mutationFn: (labData: Omit<LabType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, labData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateLabMutation = useMutation<void, Error, LabType>({
    mutationFn: (updatedLab: LabType) => updateDocumentInCollection(COLLECTION_NAME, updatedLab.id, updatedLab),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteLabMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    labs,
    loading: isFetching,
    addLab: (lab) => addLabMutation.mutateAsync(lab),
    updateLab: (lab) => updateLabMutation.mutateAsync(lab),
    deleteLab: (id) => deleteLabMutation.mutateAsync(id),
  }), [labs, isFetching, addLabMutation, updateLabMutation, deleteLabMutation]);

  return (
    <LabsContext.Provider value={value}>
      {children}
    </LabsContext.Provider>
  );
};

export const useLabs = (): LabsContextType => {
  const context = useContext(LabsContext);
  if (context === undefined) {
    throw new Error('useLabs must be used within a LabsProvider');
  }
  return context;
};
