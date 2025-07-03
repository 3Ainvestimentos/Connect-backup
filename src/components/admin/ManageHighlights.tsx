
"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManageHighlights() {
    return (
        <Card>
            <CardHeader><CardTitle>Gerenciar Destaques</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Funcionalidade de gerenciamento dos destaques da página inicial em desenvolvimento.</p>
                <p className="text-muted-foreground mt-2">Aqui você poderá adicionar, editar e remover os cards de destaque que aparecem na página inicial.</p>
            </CardContent>
        </Card>
    );
}
