
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCollection, WithId, listenToCollection } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Bot, BarChart as BarChartIcon, ThumbsUp, ThumbsDown, User, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudit } from '@/contexts/AuditContext';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';


type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { 
        term?: string;
        source?: string;
        resultsCount?: number;
        hasResults?: boolean;
        path?: string;
    };
}>;

function SearchTermsAnalytics({ events }: { events: AuditLogEvent[] }) {
    const searchTerms = useMemo(() => {
        const termMap: { [key: string]: { term: string; count: number; successes: number } } = {};
        
        events.filter(e => e.eventType === 'search_term_used' && e.details.source === 'document_repository').forEach(event => {
            const term = event.details.term?.toLowerCase();
            if (!term) return;

            if (!termMap[term]) {
                termMap[term] = { term: event.details.term!, count: 0, successes: 0 };
            }
            termMap[term].count++;
            if (event.details.hasResults) {
                termMap[term].successes++;
            }
        });
        
        return Object.values(termMap).sort((a, b) => b.count - a.count).slice(0, 10);
    }, [events]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search />Termos Mais Buscados</CardTitle>
                <CardDescription>Principais termos pesquisados no Repositório de Documentos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Termo</TableHead>
                                <TableHead>Buscas</TableHead>
                                <TableHead>Taxa de Sucesso</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searchTerms.map(item => (
                                <TableRow key={item.term}>
                                    <TableCell className="font-medium">{item.term}</TableCell>
                                    <TableCell>{item.count}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.successes > 0 ? <ThumbsUp className="h-4 w-4 text-green-500"/> : <ThumbsDown className="h-4 w-4 text-red-500"/>}
                                            {((item.successes / item.count) * 100).toFixed(0)}%
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function ChatbotAccessAnalytics({ events }: { events: AuditLogEvent[] }) {
    const chatbotAccesses = useMemo(() => {
         const accessByDate: { [key: string]: number } = {};
         events.filter(e => e.eventType === 'page_view' && e.details.path === '/chatbot').forEach(event => {
             const date = format(startOfDay(parseISO(event.timestamp)), 'yyyy-MM-dd');
             accessByDate[date] = (accessByDate[date] || 0) + 1;
         });
         
         return Object.entries(accessByDate)
             .map(([date, count]) => ({ date: format(parseISO(date), 'dd/MM'), Acessos: count }))
             .sort((a,b) => a.date.localeCompare(b.date));
    }, [events]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> Acessos ao Chatbot Bob</CardTitle>
                <CardDescription>Volume de acessos diários à página do chatbot no período selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chatbotAccesses}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} cursor={{fill: 'hsl(var(--muted))'}} />
                        <Legend />
                        <Bar dataKey="Acessos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


function UserDataInspector() {
  const { user } = useAuth();
  const { collaborators, loading } = useCollaborators();

  const currentUserData = useMemo(() => {
    if (!user || loading) return null;
    return {
      auth: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
      firestore: collaborators.find(c => c.email === user.email),
    };
  }, [user, collaborators, loading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspeção de Dados do Usuário Logado</CardTitle>
        <CardDescription>
          Dados do Firebase Auth vs. Dados do Firestore (Cache do React Query) para o usuário atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUserData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-sm">Firebase Auth (`useAuth`)</h3>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <pre>{JSON.stringify(currentUserData.auth, null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-sm">Firestore (`useCollaborators`)</h3>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                 <pre>{JSON.stringify(currentUserData.firestore, null, 2)}</pre>
              </div>
            </div>
          </div>
        ) : <Skeleton className="h-48 w-full" />}

        <div className="pt-4">
            <h3 className="font-semibold text-lg mb-2">Análise de Divergência</h3>
            {currentUserData ? (
                 <div className="flex items-center gap-4 p-3 border rounded-lg">
                    {currentUserData.firestore ? (
                        <>
                            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Colaborador encontrado no Firestore.</p>
                                <p className="text-sm text-muted-foreground">O e-mail do usuário autenticado corresponde a um registro na coleção 'collaborators'.</p>
                            </div>
                        </>
                    ) : (
                         <>
                            <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Colaborador NÃO encontrado no Firestore.</p>
                                <p className="text-sm text-muted-foreground">O e-mail '{currentUserData.auth.email}' não foi encontrado no cache de colaboradores. Isso pode causar falhas de permissão.</p>
                            </div>
                        </>
                    )}
                 </div>
            ) : <p className="text-sm text-muted-foreground">Aguardando dados para análise...</p>}
        </div>
      </CardContent>
    </Card>
  );
}


export default function UsabilityPage() {
    const queryClient = useQueryClient();
    const { dateRange } = useAudit();
    
    React.useEffect(() => {
        const unsubscribe = listenToCollection<AuditLogEvent>(
            'audit_logs',
            (newData) => {
                queryClient.setQueryData(['audit_logs'], newData);
            },
            (error) => {
                console.error("Failed to listen to audit logs:", error);
            }
        );
        return () => unsubscribe();
    }, [queryClient]);

    const { data: allEvents = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
    });

    const events = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);

        return allEvents.filter(e => {
             const eventDate = parseISO(e.timestamp);
             return isWithinInterval(eventDate, { start: from, end: to });
        });
    }, [allEvents, dateRange]);


  return (
    <SuperAdminGuard>
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SearchTermsAnalytics events={events} />
                <ChatbotAccessAnalytics events={events} />
            </div>
            <UserDataInspector />
        </div>
    </SuperAdminGuard>
  );
}
