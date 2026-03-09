"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import ManageTripsBirthdays from "@/components/admin/ManageTripsBirthdays";

export default function TravelBirthdaysControlPage() {
  return (
    <div className="space-y-6 p-6 md:p-8 admin-panel">
      <PageHeader
        title="Controle de Viagens"
        description="Gerencie as viagens dos líderes. O módulo de aniversariantes permanece preparado para ativação."
      />
      <ManageTripsBirthdays />
    </div>
  );
}
