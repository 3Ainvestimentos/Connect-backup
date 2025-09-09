
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { FabMessageType } from '@/contexts/FabMessagesContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface CampaignStatusChartProps {
    messages: FabMessageType[];
}

export default function CampaignStatusChart({ messages }: CampaignStatusChartProps) {
    
    const chartData = useMemo(() => {
        let totalCampaigns = 0;
        let completedCampaigns = 0;
        let effectiveCampaigns = 0;

        messages.forEach(message => {
            // Only count campaigns currently in the active pipeline
            totalCampaigns += message.pipeline.length;
            completedCampaigns += message.pipeline.filter(c => c.status === 'completed').length;
            effectiveCampaigns += message.pipeline.filter(c => !!c.effectiveAt).length;
        });
        
        return [
            { 
                name: 'Status', 
                'Total de Campanhas': totalCampaigns, 
                'Campanhas Concluídas': completedCampaigns,
                'Campanhas com Efetividade': effectiveCampaigns,
            }
        ];

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
                <CardTitle className="flex items-center gap-2"><BarChartIcon /> Status das Campanhas Ativas</CardTitle>
                <CardDescription>Comparativo de campanhas no pipeline, concluídas e marcadas com efetividade.</CardDescription>
            </CardHeader>
            <CardContent>
                {messages.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
                             <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                             <YAxis type="category" dataKey="name" hide />
                             <Tooltip 
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                cursor={false}
                             />
                             <Legend />
                             <Bar dataKey="Total de Campanhas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                             <Bar dataKey="Campanhas Concluídas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                             <Bar dataKey="Campanhas com Efetividade" fill="#FF8042" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                     <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center h-[300px]">
                        <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4">Nenhuma campanha encontrada para os usuários selecionados.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
