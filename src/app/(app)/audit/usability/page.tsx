
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, ListFilter, AlertTriangle, CheckCircle, Percent, BarChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, Bar, Tooltip, XAxis, YAxis, BarChart as BarChartComponent } from 'recharts';

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

    const { topSearches, noResultsSearches, searchSuccessRate } = useMemo(() => {
        if (isLoading || !events.length) return { topSearches: [], noResultsSearches: [], searchSuccessRate: [] };

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
        
        const topSearches = [...allSearches].sort((a, b) => b.count - a.count).slice(0, 10);
        const noResultsSearches = [...allSearches].filter(s => s.successRate === 0).sort((a, b) => b.count - a.count).slice(0, 10);
        
        const totalSearches = events.length;
        const totalSuccess = events.filter(e => e.details.hasResults).length;
        const totalFailed = totalSearches - totalSuccess;
        const searchSuccessRate = [
            { name: 'Buscas com Sucesso', value: totalSuccess, fill: 'hsl(var(--chart-1))' },
            { name: 'Buscas sem Resultados', value: totalFailed, fill: 'hsl(var(--chart-2))' },
        ];

        return { topSearches, noResultsSearches, searchSuccessRate };

    }, [events, isLoading]);

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    
    return (
        <SuperAdminGuard>
             <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Search className="h-6 w-6"/>Análise de Usabilidade e Busca</CardTitle>
                        <CardDescription>Entenda o que os colaboradores procuram e se estão encontrando as informações necessárias.</CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><BarChart className="h-5 w-5"/>Sucesso Geral das Buscas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={100}>
                            <BarChartComponent data={searchSuccessRate} layout="vertical" barSize={30}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" hide />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
                                <Bar dataKey="value" stackId="a" radius={[5, 5, 5, 5]} />
                            </BarChartComponent>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ListFilter className="h-5 w-5" />
                                Termos Mais Buscados
                            </CardTitle>
                            <CardDescription>
                                Os 10 termos mais pesquisados e sua taxa de sucesso.
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
                                            {topSearches.map((item) => (
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
                            {!isLoading && topSearches.length === 0 && (
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
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Principais Buscas Sem Resultados
                            </CardTitle>
                            <CardDescription>
                                Termos que os usuários mais buscam mas não encontram resultados.
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
                                            {noResultsSearches.map((item) => (
                                                <TableRow key={item.term}>
                                                    <TableCell className="font-medium">{item.term}</TableCell>
                                                    <TableCell>{item.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            {!isLoading && noResultsSearches.length === 0 && (
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
            </div>
        </SuperAdminGuard>
    );
}
