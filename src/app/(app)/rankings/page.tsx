"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRankings } from '@/contexts/RankingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function RankingsPageContent() {
    const { rankings, loading } = useRankings();

    if (loading) {
        return (
            <div className="space-y-4 flex-grow flex flex-col">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="flex-grow w-full" />
            </div>
        )
    }

    if (rankings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                <Award className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">Nenhum Documento Disponível</h2>
                <p>Nenhum documento de ranking ou campanha foi cadastrado ainda.</p>
            </div>
        )
    }

    return (
        <Tabs defaultValue={rankings[0]?.id} className="w-full flex-grow flex flex-col">
            <PageHeader
                title="Rankings e Campanhas"
                description="Acompanhe os resultados e materiais das campanhas vigentes."
                actions={
                    <TabsList>
                        {rankings.map(ranking => (
                            <TabsTrigger key={ranking.id} value={ranking.id}>{ranking.name}</TabsTrigger>
                        ))}
                    </TabsList>
                }
            />
            <div className="flex-grow">
                {rankings.map(ranking => (
                    <TabsContent key={ranking.id} value={ranking.id} className="w-full h-full m-0">
                         <iframe
                            src={`${ranking.pdfUrl}#view=fitH`}
                            title={ranking.name}
                            className="w-full h-full border-0 rounded-md"
                        />
                    </TabsContent>
                ))}
            </div>
        </Tabs>
    );
}


export default function RankingsPage() {
    const { permissions, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
        if (!loading) {
            if (!permissions.canViewRankings) {
                router.replace('/dashboard');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [loading, permissions, router]);


    if (loading || !isAuthorized) {
        return (
            <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    return (
        <div className="p-6 md:p-8 flex flex-col h-full">
            <RankingsPageContent />
        </div>
    );
}
