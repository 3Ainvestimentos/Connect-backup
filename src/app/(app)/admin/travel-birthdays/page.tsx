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

  return (
    <div className="space-y-6 p-6 md:p-8 admin-panel">
      <PageHeader
        title="Controle de Viagens/Ferias"
        description="Gerencie viagens dos líderes e seus períodos de férias em uma única área."
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          {canViewTrips && <TabsTrigger value="viagens">Viagens</TabsTrigger>}
          {canViewVacation && <TabsTrigger value="ferias">Férias</TabsTrigger>}
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
    </div>
  );
}
