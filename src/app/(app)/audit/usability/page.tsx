
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, ListFilter, AlertTriangle, CheckCircle, Percent } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type AuditLogEvent = WithId<{
    eventType: 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string;
    details: {
        term: string;
        source: 'document_repository';
        resultsCount: number;
        hasResults: boolean;
    }
}>;

export default function UsabilitySearchPage() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
        select: (data) => data.filter(e => e.eventType === 'search_term_used'),
    });

    const searchAnalytics = useMemo(() => {
        if (isLoading || !events.length) return { topSearches: [], noResultsSearches: [] };

        const termStats: { [term: string]: { count: number; success: number } } = {};

        events.forEach(event => {
            const term = event.details.term.toLowerCase().trim();
            if (!term) return;

            if (!termStats[term]) {
                termStats[term] = { count: 0, success: 0 };
            }
            termStats[term].count++;
            if (event.details.hasResults) {
                termStats[term].success++;
            }
        });

        const allSearches = Object.entries(termStats).map(([term, stats]) => ({
            term,
            count: stats.count,
            successRate: (stats.success / stats.count) * 100,
        }));
        
        const topSearches = [...allSearches].sort((a, b) => b.count - a.count).slice(0, 15);
        const noResultsSearches = [...allSearches].filter(s => s.successRate === 0).sort((a, b) => b.count - a.count).slice(0, 15);
        
        return { topSearches, noResultsSearches };

    }, [events, isLoading]);

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    
    return (
        <SuperAdminGuard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListFilter className="h-6 w-6" />
                            Termos Mais Buscados
                        </CardTitle>
                        <CardDescription>
                            Termos mais pesquisados no repositório de documentos e sua taxa de sucesso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? renderSkeleton() : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Termo</TableHead>
                                            <TableHead>Nº de Buscas</TableHead>
                                            <TableHead>Taxa de Sucesso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchAnalytics.topSearches.map((item) => (
                                            <TableRow key={item.term}>
                                                <TableCell className="font-medium">{item.term}</TableCell>
                                                <TableCell>{item.count}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={item.successRate} className="w-24 h-2" />
                                                        <span className="text-muted-foreground">{item.successRate.toFixed(0)}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {!isLoading && searchAnalytics.topSearches.length === 0 && (
                            <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum termo de busca registrado</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Ainda não há dados de busca de documentos para exibir.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Principais Buscas Sem Resultados
                        </CardTitle>
                        <CardDescription>
                            Termos que os usuários buscam mas não encontram resultados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? renderSkeleton() : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Termo</TableHead>
                                            <TableHead>Nº de Tentativas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchAnalytics.noResultsSearches.map((item) => (
                                            <TableRow key={item.term}>
                                                <TableCell className="font-medium">{item.term}</TableCell>
                                                <TableCell>{item.count}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {!isLoading && searchAnalytics.noResultsSearches.length === 0 && (
                            <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">Boas notícias!</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Não foram encontradas buscas sem resultados recentemente.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
