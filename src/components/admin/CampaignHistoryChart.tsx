
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
        const dailyStats: { [date: string]: { ctaSent: number, followUpDisplayed: number } } = {};

        messages.forEach(message => {
            message.pipeline.forEach(campaign => {
                if (campaign.sentAt) {
                    const date = format(startOfDay(parseISO(campaign.sentAt)), 'yyyy-MM-dd');
                    if (!dailyStats[date]) dailyStats[date] = { ctaSent: 0, followUpDisplayed: 0 };
                    dailyStats[date].ctaSent++;
                }
                if (campaign.clickedAt) {
                    const date = format(startOfDay(parseISO(campaign.clickedAt)), 'yyyy-MM-dd');
                     if (!dailyStats[date]) dailyStats[date] = { ctaSent: 0, followUpDisplayed: 0 };
                    dailyStats[date].followUpDisplayed++;
                }
            });
        });

        return Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date: format(parseISO(date), 'dd/MM'),
                'CTAs Enviados': stats.ctaSent,
                'Follow-ups Exibidos': stats.followUpDisplayed
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
                            <Line type="monotone" dataKey="CTAs Enviados" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Follow-ups Exibidos" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 8 }}/>
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
