
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import MeetingAnalysesList from '@/components/meet-analyses/MeetingAnalysesList';

export default function MeetAnalysesPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader 
        title="Bob Meet Análises" 
        description="Visualize e analise as reuniões processadas pelo Bob."
      />
      <MeetingAnalysesList />
    </div>
  );
}
