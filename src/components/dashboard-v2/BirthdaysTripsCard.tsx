"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, ArrowRight, Gift, UserCircle } from "lucide-react";
import { useTripsBirthdays } from "@/contexts/TripsBirthdaysContext";
import { useAuth } from "@/contexts/AuthContext";

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

export default function BirthdaysTripsCard() {
  const { birthdays, trips } = useTripsBirthdays();
  const { isAdmin, isSuperAdmin, currentUserCollab } = useAuth();

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
          {ENABLE_BIRTHDAYS_UI ? "Aniversários & Viagens" : "Viagens dos Líderes"}
        </CardTitle>
        <CardDescription>
          {ENABLE_BIRTHDAYS_UI
            ? "Acompanhe aniversariantes do mês e viagens dos líderes."
            : isAdmin || isSuperAdmin
              ? "Acompanhe as viagens programadas dos líderes."
              : "Acompanhe as viagens programadas dos líderes para sua cidade."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={
            ENABLE_BIRTHDAYS_UI
              ? "grid grid-cols-1 md:grid-cols-2 md:gap-0 rounded-lg border divide-y md:divide-y-0 md:divide-x"
              : "grid grid-cols-1 rounded-lg border"
          }
        >
          {ENABLE_BIRTHDAYS_UI && (
            <div className="p-4 md:p-5 bg-muted/20">
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

          <div className="p-4 md:p-5">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Plane className="h-4 w-4 text-sky-600" />
              Viagens dos Líderes
            </h4>
            <div className="space-y-4">
              {groupedTripsByDestination.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {groupedTripsByDestination.map(([destination, destinationTrips]) => (
                    <div key={destination} className="rounded-md border p-3 bg-card">
                      <div className="inline-flex min-w-[140px] justify-center rounded-md border px-3 py-1 text-sm font-semibold">
                        {destination}
                      </div>
                      <div className="mt-3 space-y-2">
                        {destinationTrips.map((trip) => (
                          <div key={trip.id} className="text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Plane className="h-3.5 w-3.5 shrink-0" />
                              <div className="relative flex-1 h-px border-t border-dashed border-muted-foreground/50">
                                <ArrowRight className="h-3.5 w-3.5 absolute -right-1 -top-[7px]" />
                              </div>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-3">
                              <div className="truncate">
                                <span className="text-orange-500 mr-1.5">•</span>
                                {trip.leaderName}
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                  <UserCircle className="h-3 w-3 shrink-0" />
                                  {trip.responsavelNome || "Sem responsável"}
                                </span>
                              </div>
                              <span className="text-muted-foreground tabular-nums text-xs whitespace-nowrap">
                                {formatDateDDMM(trip.startDate)} - {formatDateDDMM(trip.endDate)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma viagem ativa no momento.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
