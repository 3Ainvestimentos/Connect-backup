"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import {
  addDocumentToCollection,
  updateDocumentInCollection,
  deleteDocumentFromCollection,
  WithId,
  listenToCollection,
  getCollection,
} from "@/lib/firestore-service";
import { useAuth } from "./AuthContext";

const TRIPS_COLLECTION = "leaderTrips";
const BIRTHDAYS_COLLECTION = "birthdays";

export interface LeaderTripType {
  id: string;
  leaderName: string;
  destinationBranch: string;
  startDate: string;
  endDate: string;
  responsavelUid: string;
  responsavelNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface BirthdayType {
  id: string;
  fullName: string;
  unitCode: string;
  birthDateISO: string;
  dayMonth: string;
  source: "xlsx-upload";
  createdAt: string;
  updatedAt: string;
}

export interface BirthdayImportRow {
  fullName: string;
  unitCode: string;
  birthDateISO: string;
  dayMonth: string;
}

interface ImportBirthdaysResult {
  totalReceived: number;
  created: number;
  updated: number;
  skipped: number;
}

type AddTripInput = Omit<LeaderTripType, "id" | "createdAt" | "updatedAt" | "responsavelUid" | "responsavelNome">;

interface TripsBirthdaysContextType {
  trips: LeaderTripType[];
  birthdays: BirthdayType[];
  loading: boolean;
  addTrip: (trip: AddTripInput) => Promise<WithId<Omit<LeaderTripType, "id">>>;
  updateTrip: (trip: LeaderTripType) => Promise<void>;
  deleteTripMutation: UseMutationResult<void, Error, string, unknown>;
  importBirthdays: (rows: BirthdayImportRow[]) => Promise<ImportBirthdaysResult>;
  deleteBirthdayMutation: UseMutationResult<void, Error, string, unknown>;
  clearBirthdays: () => Promise<void>;
}

const TripsBirthdaysContext = createContext<TripsBirthdaysContextType | undefined>(undefined);

function isPermissionError(error: unknown) {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes("permission") || msg.includes("insufficient");
}

async function safeGetCollection<T>(collectionName: string): Promise<WithId<T>[]> {
  try {
    return await getCollection<T>(collectionName);
  } catch (error) {
    if (isPermissionError(error)) {
      // Evita ruído no console quando as regras ainda não foram publicadas.
      return [];
    }
    throw error;
  }
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function sortBirthdays(items: BirthdayType[]) {
  return [...items].sort((a, b) => {
    const [aDay, aMonth] = a.dayMonth.split("/").map(Number);
    const [bDay, bMonth] = b.dayMonth.split("/").map(Number);
    if (aMonth !== bMonth) return aMonth - bMonth;
    if (aDay !== bDay) return aDay - bDay;
    return a.fullName.localeCompare(b.fullName, "pt-BR");
  });
}

function sortTrips(items: LeaderTripType[]) {
  return [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export const TripsBirthdaysProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user, currentUserCollab } = useAuth();

  const { data: trips = [], isFetching: loadingTrips } = useQuery<LeaderTripType[]>({
    queryKey: [TRIPS_COLLECTION],
    queryFn: () => safeGetCollection<LeaderTripType>(TRIPS_COLLECTION),
    enabled: !!user,
    staleTime: Infinity,
    retry: false,
    select: sortTrips,
  });

  const { data: birthdays = [], isFetching: loadingBirthdays } = useQuery<BirthdayType[]>({
    queryKey: [BIRTHDAYS_COLLECTION],
    queryFn: () => safeGetCollection<BirthdayType>(BIRTHDAYS_COLLECTION),
    enabled: !!user,
    staleTime: Infinity,
    retry: false,
    select: sortBirthdays,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<LeaderTripType>(
      TRIPS_COLLECTION,
      (newData) => queryClient.setQueryData([TRIPS_COLLECTION], sortTrips(newData as LeaderTripType[])),
      (error) => {
        if (!isPermissionError(error)) {
          console.error("Failed to listen to leaderTrips:", error);
        }
      }
    );
    return () => unsubscribe();
  }, [queryClient, user]);

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<BirthdayType>(
      BIRTHDAYS_COLLECTION,
      (newData) => queryClient.setQueryData([BIRTHDAYS_COLLECTION], sortBirthdays(newData as BirthdayType[])),
      (error) => {
        if (!isPermissionError(error)) {
          console.error("Failed to listen to birthdays:", error);
        }
      }
    );
    return () => unsubscribe();
  }, [queryClient, user]);

  const addTripMutation = useMutation<
    WithId<Omit<LeaderTripType, "id">>,
    Error,
    AddTripInput
  >({
    mutationFn: async (tripData) => {
      const now = new Date().toISOString();
      const responsavelNome =
        currentUserCollab?.name?.trim() ||
        user?.displayName?.trim() ||
        user?.email?.trim() ||
        "Desconhecido";
      return addDocumentToCollection(TRIPS_COLLECTION, {
        ...tripData,
        responsavelUid: user?.uid ?? "",
        responsavelNome,
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TRIPS_COLLECTION] }),
  });

  const updateTripMutation = useMutation<void, Error, LeaderTripType>({
    mutationFn: async (trip) => {
      const { id, ...rest } = trip;
      await updateDocumentInCollection(TRIPS_COLLECTION, id, { ...rest, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TRIPS_COLLECTION] }),
  });

  const deleteTripMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => deleteDocumentFromCollection(TRIPS_COLLECTION, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TRIPS_COLLECTION] }),
  });

  const deleteBirthdayMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => deleteDocumentFromCollection(BIRTHDAYS_COLLECTION, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [BIRTHDAYS_COLLECTION] }),
  });

  const importBirthdaysMutation = useMutation<ImportBirthdaysResult, Error, BirthdayImportRow[]>({
    mutationFn: async (rows: BirthdayImportRow[]) => {
      const existingMap = new Map<string, BirthdayType>(
        birthdays.map((item) => [`${normalizeName(item.fullName)}|${item.dayMonth}`, item])
      );

      let created = 0;
      let updated = 0;
      let skipped = 0;

      const dedupedIncoming = new Map<string, BirthdayImportRow>();
      rows.forEach((row) => {
        const normalizedName = normalizeName(row.fullName);
        if (!normalizedName || !row.dayMonth) {
          skipped += 1;
          return;
        }
        dedupedIncoming.set(`${normalizedName}|${row.dayMonth}`, row);
      });

      for (const [key, row] of dedupedIncoming.entries()) {
        const now = new Date().toISOString();
        const existing = existingMap.get(key);
        if (existing) {
          await updateDocumentInCollection(BIRTHDAYS_COLLECTION, existing.id, {
            fullName: row.fullName.trim(),
            unitCode: row.unitCode.trim(),
            birthDateISO: row.birthDateISO,
            dayMonth: row.dayMonth,
            source: "xlsx-upload",
            updatedAt: now,
          });
          updated += 1;
        } else {
          await addDocumentToCollection(BIRTHDAYS_COLLECTION, {
            fullName: row.fullName.trim(),
            unitCode: row.unitCode.trim(),
            birthDateISO: row.birthDateISO,
            dayMonth: row.dayMonth,
            source: "xlsx-upload" as const,
            createdAt: now,
            updatedAt: now,
          });
          created += 1;
        }
      }

      return { totalReceived: rows.length, created, updated, skipped };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [BIRTHDAYS_COLLECTION] }),
  });

  const clearBirthdaysMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await Promise.all(birthdays.map((item) => deleteDocumentFromCollection(BIRTHDAYS_COLLECTION, item.id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [BIRTHDAYS_COLLECTION] }),
  });

  const value: TripsBirthdaysContextType = useMemo(
    () => ({
      trips,
      birthdays,
      loading: loadingTrips || loadingBirthdays,
      addTrip: (trip: AddTripInput) => addTripMutation.mutateAsync(trip),
      updateTrip: (trip: LeaderTripType) => updateTripMutation.mutateAsync(trip),
      deleteTripMutation,
      importBirthdays: (rows: BirthdayImportRow[]) => importBirthdaysMutation.mutateAsync(rows),
      deleteBirthdayMutation,
      clearBirthdays: () => clearBirthdaysMutation.mutateAsync(),
    }),
    [
      trips,
      birthdays,
      loadingTrips,
      loadingBirthdays,
      addTripMutation,
      updateTripMutation,
      deleteTripMutation,
      importBirthdaysMutation,
      deleteBirthdayMutation,
      clearBirthdaysMutation,
    ]
  );

  return <TripsBirthdaysContext.Provider value={value}>{children}</TripsBirthdaysContext.Provider>;
};

export const useTripsBirthdays = (): TripsBirthdaysContextType => {
  const context = useContext(TripsBirthdaysContext);
  if (!context) {
    throw new Error("useTripsBirthdays must be used within a TripsBirthdaysProvider");
  }
  return context;
};
