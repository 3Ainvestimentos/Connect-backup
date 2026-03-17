"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import ManageTripsBirthdays from "@/components/admin/ManageTripsBirthdays";
import ManageVacations from "@/components/admin/ManageVacations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

export default function TravelBirthdaysControlPage() {
  const { permissions } = useAuth();
  const canViewTrips = permissions.canManageTripsBirthdays;
  const canViewVacation = permissions.canManageVacation;
  const defaultTab = canViewTrips ? "viagens" : "ferias";
  const showTabs = canViewTrips && canViewVacation;
  const tabsGridClass = canViewTrips && canViewVacation ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="space-y-6 p-6 md:p-8 admin-panel">
      <PageHeader
        title="Controle de Viagens/Ferias"
        description="Gerencie viagens dos líderes e seus períodos de férias em uma única área."
      />

      {showTabs ? (
        <Tabs defaultValue={defaultTab} className="w-full space-y-2">
          <TabsList className={`grid h-10 w-full max-w-4xl mx-auto rounded-lg bg-muted/70 p-1 ${tabsGridClass}`}>
            {canViewTrips && (
              <TabsTrigger value="viagens" className="h-8 rounded-md text-sm font-semibold">
                Viagens
              </TabsTrigger>
            )}
            {canViewVacation && (
              <TabsTrigger value="ferias" className="h-8 rounded-md text-sm font-semibold">
                Férias
              </TabsTrigger>
            )}
          </TabsList>

          {canViewTrips && (
            <TabsContent value="viagens">
              <ManageTripsBirthdays />
            </TabsContent>
          )}
          {canViewVacation && (
            <TabsContent value="ferias">
              <ManageVacations />
            </TabsContent>
          )}
        </Tabs>
      ) : canViewVacation ? (
        <ManageVacations />
      ) : (
        <ManageTripsBirthdays />
      )}
    </div>
  );
}
