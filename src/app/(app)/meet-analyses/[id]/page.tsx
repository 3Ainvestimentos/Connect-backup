
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMeetingAnalyses } from '@/contexts/MeetingAnalysesContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MeetingAnalysisDetail from '@/components/meet-analyses/MeetingAnalysisDetail';

export default function MeetingAnalysisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = decodeURIComponent(params.id as string);
  const { meetingAnalyses, loading } = useMeetingAnalyses();

  const analysis = React.useMemo(() => {
    const found = meetingAnalyses.find(a => a.id === analysisId);
    
    // Debug: log para ajudar a identificar o problema
    if (!found && !loading && meetingAnalyses.length > 0) {
      console.log('Analysis ID from URL:', analysisId);
      console.log('Available analysis IDs:', meetingAnalyses.map(a => a.id));
      console.log('Total analyses:', meetingAnalyses.length);
    }
    
    return found;
  }, [meetingAnalyses, analysisId, loading]);

  if (loading) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Só mostrar "não encontrada" se não estiver carregando E já tiver análises carregadas
  if (!analysis && !loading && meetingAnalyses.length > 0) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/meet-analyses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Análise não encontrada</h2>
          <p className="text-muted-foreground">
            A análise solicitada não foi encontrada ou você não tem permissão para visualizá-la.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ID buscado: {analysisId}
          </p>
        </div>
      </div>
    );
  }

  // Se ainda está carregando ou não tem análises, mostrar loading
  if (!analysis) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/meet-analyses')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para análises
      </Button>
      <MeetingAnalysisDetail analysis={analysis} />
    </div>
  );
}
