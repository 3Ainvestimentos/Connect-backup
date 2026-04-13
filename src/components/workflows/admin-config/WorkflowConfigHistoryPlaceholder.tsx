import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock3 } from 'lucide-react';

export function WorkflowConfigHistoryPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico Geral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Planejado para a proxima subetapa</AlertTitle>
          <AlertDescription>
            Esta aba ja faz parte do shell oficial, mas o grid consolidado de historico ainda nao entra
            na 2E.1.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          O objetivo atual e validar permissao, navegacao e leitura do catalogo hierarquico sem assumir o
          contrato final do historico administrativo.
        </p>
      </CardContent>
    </Card>
  );
}
