
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { FabMessageType } from '@/contexts/FabMessagesContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { format, parseISO, startOfDay } from 'date-fns';

interface CampaignHistoryChartProps {
    messages: FabMessageType[];
}

export default function CampaignHistoryChart({ messages }: CampaignHistoryChartProps) {
    
    const chartData = useMemo(() => {
        const dailyStats: { [date: string]: { total: number, concluidas: number, efetivas: number, interrompidas: number } } = {};

        messages.forEach(message => {
            message.pipeline.forEach(campaign => {
                // Total de Campanhas (quando foi enviada)
                if (campaign.sentAt) {
                    const date = format(startOfDay(parseISO(campaign.sentAt)), 'yyyy-MM-dd');
                    if (!dailyStats[date]) dailyStats[date] = { total: 0, concluidas: 0, efetivas: 0, interrompidas: 0 };
                    dailyStats[date].total++;
                }
                // Campanhas Concluídas (quando o follow-up foi fechado)
                if (campaign.followUpClosedAt) {
                     const date = format(startOfDay(parseISO(campaign.followUpClosedAt)), 'yyyy-MM-dd');
                     if (!dailyStats[date]) dailyStats[date] = { total: 0, concluidas: 0, efetivas: 0, interrompidas: 0 };
                     dailyStats[date].concluidas++;
                }
                // Campanhas com Efetividade
                if (campaign.effectiveAt) {
                     const date = format(startOfDay(parseISO(campaign.effectiveAt)), 'yyyy-MM-dd');
                     if (!dailyStats[date]) dailyStats[date] = { total: 0, concluidas: 0, efetivas: 0, interrompidas: 0 };
                     dailyStats[date].efetivas++;
                }
                // Campanhas Interrompidas
                if (campaign.status === 'interrupted' && campaign.sentAt) {
                     const date = format(startOfDay(parseISO(campaign.sentAt)), 'yyyy-MM-dd');
                     if (!dailyStats[date]) dailyStats[date] = { total: 0, concluidas: 0, efetivas: 0, interrompidas: 0 };
                     dailyStats[date].interrompidas++;
                }
            });
        });

        return Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date: format(parseISO(date), 'dd/MM'),
                'Campanhas Enviadas': stats.total,
                'Campanhas Concluídas': stats.concluidas,
                'Campanhas com Efetividade': stats.efetivas,
                'Campanhas Interrompidas': stats.interrompidas,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

    }, [messages]);

    if (!messages) {
        return (
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LineChartIcon /> Histórico de Campanhas</CardTitle>
                <CardDescription>Volume de interações com as campanhas ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent>
                {messages.length > 0 && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="Campanhas Enviadas" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Campanhas Concluídas" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 8 }}/>
                            <Line type="monotone" dataKey="Campanhas com Efetividade" stroke="#FF8042" strokeWidth={2} activeDot={{ r: 8 }}/>
                            <Line type="monotone" dataKey="Campanhas Interrompidas" stroke="hsl(var(--destructive))" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                     <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center h-[300px]">
                        <LineChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4">Nenhum dado histórico encontrado para os usuários selecionados.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
