"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Gift } from "lucide-react";
import { useTripsBirthdays } from "@/contexts/TripsBirthdaysContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaborators } from "@/contexts/CollaboratorsContext";

const ENABLE_BIRTHDAYS_UI = false;

function getShortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function formatDateDDMM(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "--/--";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function extractCity(destinationBranch: string): string {
  return destinationBranch.split(" - ")[0].trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function BirthdaysTripsCard() {
  const { birthdays, trips } = useTripsBirthdays();
  const { isAdmin, isSuperAdmin, currentUserCollab } = useAuth();
  const { collaborators } = useCollaborators();

  const leaderAreaMap = useMemo(() => {
    const map = new Map<string, string>();
    collaborators.forEach((c) => {
      map.set(normalizeName(c.name).toLowerCase(), c.area ?? "");
    });
    return map;
  }, [collaborators]);

  const currentMonthBirthdays = useMemo(() => {
    if (!ENABLE_BIRTHDAYS_UI) return [];
    const currentMonth = new Date().getMonth() + 1;
    return birthdays
      .filter((item) => {
        const [, month] = item.dayMonth.split("/").map(Number);
        return month === currentMonth;
      })
      .sort((a, b) => {
        const [aDay] = a.dayMonth.split("/").map(Number);
        const [bDay] = b.dayMonth.split("/").map(Number);
        return aDay - bDay;
      });
  }, [birthdays]);

  const activeTrips = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const active = trips.filter((trip) => {
      const [y, m, d] = trip.endDate.split("-").map(Number);
      const end = new Date(y, m - 1, d);
      return end >= now;
    });

    const userCity = currentUserCollab?.city ? normalizeCity(currentUserCollab.city) : "";
    const canSeeAllTrips = isAdmin || isSuperAdmin;

    const filtered = canSeeAllTrips
      ? active
      : userCity
        ? active.filter((trip) => extractCity(trip.destinationBranch) === userCity)
        : [];

    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [trips, currentUserCollab?.city, isAdmin, isSuperAdmin]);

  const groupedTripsByDestination = useMemo(() => {
    const map = new Map<string, typeof activeTrips>();
    activeTrips.forEach((trip) => {
      const key = trip.destinationBranch;
      const current = map.get(key) || [];
      current.push(trip);
      map.set(key, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [activeTrips]);

  return (
    <Card className="shadow-sm w-full">
      <CardHeader>
        <CardTitle className="font-headline text-foreground text-xl">
          {ENABLE_BIRTHDAYS_UI ? "Aniversários & Viagens" : "Agenda de Viagens"}
        </CardTitle>
        <CardDescription>Acompanhe as viagens programadas das áreas na sua filial.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {ENABLE_BIRTHDAYS_UI && (
          <div className="p-4 md:p-5 bg-muted/20 border-b">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-500" />
              Aniversariantes do Mês
            </h4>
            <div className="space-y-2">
              {currentMonthBirthdays.length > 0 ? (
                currentMonthBirthdays.map((item) => (
                  <div key={item.id} className="rounded-md border p-2 text-sm flex items-center justify-between">
                    <span className="truncate pr-3">{getShortName(item.fullName)}</span>
                    <span className="text-muted-foreground tabular-nums">{item.dayMonth}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum aniversariante neste mês.</p>
              )}
            </div>
          </div>
        )}
        <div className="p-3">
            <div className="space-y-2">
              {groupedTripsByDestination.length > 0 ? (
                groupedTripsByDestination.map(([destination, destinationTrips]) => (
                  <div key={destination} className="rounded-md border p-2 bg-card">
                    <p className="text-xs font-semibold text-foreground truncate mb-2">{destination}</p>
                    <div className="space-y-2">
                      {destinationTrips.map((trip) => {
                        const area = leaderAreaMap.get(normalizeName(trip.leaderName).toLowerCase()) ?? "";
                        return (
                          <div key={trip.id} className="flex items-start gap-1.5">
                            <Plane className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{trip.leaderName}</p>
                              {area && (
                                <p className="text-[10px] text-muted-foreground truncate">{area}</p>
                              )}
                              <p className="text-[11px] text-muted-foreground">
                                {formatDateDDMM(trip.startDate)} - {formatDateDDMM(trip.endDate)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma viagem ativa no momento.</p>
              )}
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
