
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useFabMessages, campaignTags } from '@/contexts/FabMessagesContext';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell as RechartsCell } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function TagDistributionChart() {
    const { fabMessages, loading } = useFabMessages();

    const tagCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        campaignTags.forEach(tag => counts[tag] = 0);

        fabMessages.forEach(message => {
            message.pipeline.forEach(campaign => {
                if (counts[campaign.tag] !== undefined) {
                    counts[campaign.tag]++;
                }
            });
            message.archivedCampaigns.forEach(campaign => {
                if (counts[campaign.tag] !== undefined) {
                    counts[campaign.tag]++;
                }
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [fabMessages]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    if (loading) {
        return (
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-64 w-full rounded-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon /> Distribuição de Campanhas por Tag</CardTitle>
                <CardDescription>Visualização da proporção de todas as campanhas (ativas e arquivadas) por categoria.</CardDescription>
            </CardHeader>
            <CardContent>
                 {fabMessages.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={tagCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {tagCounts.map((entry, index) => (
                                    <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4">Nenhuma campanha encontrada para exibir no gráfico.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
};
