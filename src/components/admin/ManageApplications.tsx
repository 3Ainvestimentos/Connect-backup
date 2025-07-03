
"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManageApplications() {
    return (
        <Card>
            <CardHeader><CardTitle>Gerenciar Aplicações</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Funcionalidade de gerenciamento de aplicações em desenvolvimento.</p>
                <p className="text-muted-foreground mt-2">Aqui você poderá adicionar, editar e excluir as aplicações disponíveis, bem como configurar as ações dos modais.</p>
            </CardContent>
        </Card>
    );
}
