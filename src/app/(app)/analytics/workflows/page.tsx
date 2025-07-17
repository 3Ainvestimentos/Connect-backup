
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function WorkflowAnalyticsPage() {
    // This page is now deprecated. The content has been moved to the Audit section.
    // This component remains to prevent breaking the route, but shows a message.
  return (
    <AdminGuard>
        <Card>
            <CardHeader>
                <CardTitle>Página Movida</CardTitle>
            </CardHeader>
            <CardContent>
                <p>A análise de workflows foi movida para o painel de <a href="/audit/workflow-efficiency" className="underline text-primary">Auditoria</a> para uma visão mais centralizada.</p>
            </CardContent>
        </Card>
    </AdminGuard>
  );
}
