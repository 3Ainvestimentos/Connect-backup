import { Controller, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { WorkflowConfigAreaLookup, WorkflowConfigOwnerLookup } from '@/lib/workflows/admin-config/types';
import type { WorkflowDraftFormValues } from './WorkflowDraftEditorPage';

export function WorkflowDraftGeneralSection({
  areas,
  owners,
  workflowTypeId,
  version,
}: {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
  workflowTypeId: string;
  version: number;
}) {
  const { register, control, formState: { errors } } = useFormContext<WorkflowDraftFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuracao geral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-2">
          <p>workflowTypeId: {workflowTypeId}</p>
          <p>versao: v{version}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-name">Nome</Label>
          <Input id="draft-name" {...register('general.name')} />
          {errors.general?.name ? <p className="text-sm text-destructive">{errors.general.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-description">Descricao</Label>
          <Textarea id="draft-description" rows={3} {...register('general.description')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Area</Label>
            <Controller
              name="general.areaId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.areaId} value={area.areaId}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Icone</Label>
            <Input {...register('general.icon')} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Owner</Label>
            <Controller
              name="general.ownerUserId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.userId} value={owner.userId}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft-sla">SLA padrao (dias)</Label>
            <Input id="draft-sla" type="number" min={0} {...register('general.defaultSlaDays', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-owner-email">Owner email</Label>
          <Input id="draft-owner-email" {...register('general.ownerEmail')} readOnly />
        </div>

        <div className="flex items-center justify-between rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">Ativar quando publicar</p>
            <p className="text-xs text-muted-foreground">
              Esse flag e salvo no snapshot do draft e so sera promovido na 2E.3.
            </p>
          </div>
          <Controller
            name="general.activeOnPublish"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
