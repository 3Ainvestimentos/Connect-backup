
"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManageLabs() {
    return (
        <Card>
            <CardHeader><CardTitle>Gerenciar Labs</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Funcionalidade de gerenciamento de vídeos e materiais do Labs em desenvolvimento.</p>
                <p className="text-muted-foreground mt-2">Aqui você poderá adicionar, editar e excluir os vídeos de treinamento.</p>
            </CardContent>
        </Card>
    );
}
