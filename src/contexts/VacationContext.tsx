"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useMutation, useQuery, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import {
  addDocumentToCollection,
  deleteDocumentFromCollection,
  updateDocumentInCollection,
  getCollection,
  listenToCollection,
  WithId,
} from "@/lib/firestore-service";
import { useAuth } from "./AuthContext";

const VACATIONS_COLLECTION = "vacations";
const TOTAL_VACATION_DAYS = 22;

export interface VacationType {
  id: string;
  collaboratorUid: string;
  collaboratorName: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  createdAt: string;
  updatedAt: string;
}

type AddVacationInput = Omit<VacationType, "id" | "collaboratorUid" | "collaboratorName" | "createdAt" | "updatedAt">;

interface VacationContextType {
  vacations: VacationType[];
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  loading: boolean;
  addVacation: (input: AddVacationInput) => Promise<WithId<Omit<VacationType, "id">>>;
  updateVacation: (vacation: VacationType) => Promise<void>;
  deleteVacationMutation: UseMutationResult<void, Error, string, unknown>;
}

const VacationContext = createContext<VacationContextType | undefined>(undefined);

function sortVacations(items: VacationType[]) {
  return [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function getVacationYear(vacation: VacationType) {
  return Number(vacation.startDate.split("-")[0]);
}

export function VacationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user, currentUserCollab, isSuperAdmin } = useAuth();

  const { data: vacations = [], isFetching } = useQuery<VacationType[]>({
    queryKey: [VACATIONS_COLLECTION, user?.uid, isSuperAdmin ? "all" : "own"],
    queryFn: async () => {
      const all = await getCollection<VacationType>(VACATIONS_COLLECTION);
      if (isSuperAdmin) return sortVacations(all);
      return sortVacations(all.filter((item) => item.collaboratorUid === user?.uid));
    },
    enabled: !!user,
    staleTime: Infinity,
    retry: false,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<VacationType>(
      VACATIONS_COLLECTION,
      (newData) => {
        const normalized = newData as VacationType[];
        const visible = isSuperAdmin ? normalized : normalized.filter((item) => item.collaboratorUid === user.uid);
        queryClient.setQueryData([VACATIONS_COLLECTION, user.uid, isSuperAdmin ? "all" : "own"], sortVacations(visible));
      },
      (error) => {
        console.error("Failed to listen to vacations:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, user, isSuperAdmin]);

  const addVacationMutation = useMutation<WithId<Omit<VacationType, "id">>, Error, AddVacationInput>({
    mutationFn: async (input) => {
      const now = new Date().toISOString();
      const collaboratorName =
        currentUserCollab?.name?.trim() ||
        user?.displayName?.trim() ||
        user?.email?.trim() ||
        "Desconhecido";
      return addDocumentToCollection(VACATIONS_COLLECTION, {
        ...input,
        collaboratorUid: user?.uid ?? "",
        collaboratorName,
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VACATIONS_COLLECTION, user?.uid, isSuperAdmin ? "all" : "own"] }),
  });

  const updateVacationMutation = useMutation<void, Error, VacationType>({
    mutationFn: async (vacation) => {
      const current = vacations.find((item) => item.id === vacation.id);
      if (!current) {
        throw new Error("Ferias nao encontradas.");
      }
      if (!isSuperAdmin) {
        throw new Error("Apenas administradores podem editar ferias.");
      }

      const { id, ...data } = vacation;
      await updateDocumentInCollection(VACATIONS_COLLECTION, id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VACATIONS_COLLECTION, user?.uid, isSuperAdmin ? "all" : "own"] }),
  });

  const deleteVacationMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const vacation = vacations.find((item) => item.id === id);
      if (!vacation) {
        throw new Error("Ferias nao encontradas.");
      }
      if (!isSuperAdmin) {
        throw new Error("Apenas administradores podem excluir ferias.");
      }
      await deleteDocumentFromCollection(VACATIONS_COLLECTION, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VACATIONS_COLLECTION, user?.uid, isSuperAdmin ? "all" : "own"] }),
  });

  const myVacations = useMemo(
    () => vacations.filter((item) => item.collaboratorUid === user?.uid),
    [vacations, user?.uid]
  );
  const currentYear = new Date().getFullYear();
  const myCurrentYearVacations = useMemo(
    () => myVacations.filter((item) => getVacationYear(item) === currentYear),
    [myVacations, currentYear]
  );
  const usedDays = useMemo(
    () => myCurrentYearVacations.reduce((acc, item) => acc + Math.max(0, Number(item.businessDays || 0)), 0),
    [myCurrentYearVacations]
  );
  const remainingDays = Math.max(0, TOTAL_VACATION_DAYS - usedDays);

  const value = useMemo(
    () => ({
      vacations,
      totalDays: TOTAL_VACATION_DAYS,
      usedDays,
      remainingDays,
      loading: isFetching,
      addVacation: (input: AddVacationInput) => addVacationMutation.mutateAsync(input),
      updateVacation: (vacation: VacationType) => updateVacationMutation.mutateAsync(vacation),
      deleteVacationMutation,
    }),
    [vacations, usedDays, remainingDays, isFetching, addVacationMutation, updateVacationMutation, deleteVacationMutation]
  );

  return <VacationContext.Provider value={value}>{children}</VacationContext.Provider>;
}

export function useVacation() {
  const context = useContext(VacationContext);
  if (!context) {
    throw new Error("useVacation must be used within a VacationProvider");
  }
  return context;
}
