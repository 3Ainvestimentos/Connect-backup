"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OpportunityMapPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Oportunidades</CardTitle>
          <CardDescription>
            Esta funcionalidade está temporariamente indisponível. Entre em
            contato com o time de produto caso precise de suporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Rota mantida para compatibilidade com fluxos existentes.</p>
          <p>Nenhum dado sensível é exposto nesta página.</p>
        </CardContent>
      </Card>
    </div>
  );
}
