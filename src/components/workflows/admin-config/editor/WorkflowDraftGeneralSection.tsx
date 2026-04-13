import { Controller, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getIcon } from '@/lib/icons';
import { iconList } from '@/lib/icon-list';
import type { WorkflowConfigAreaLookup, WorkflowConfigOwnerLookup } from '@/lib/workflows/admin-config/types';
import type { WorkflowDraftFormValues } from './types';

export function WorkflowDraftGeneralSection({
  areas,
  owners,
  workflowTypeId,
  version,
  readOnly = false,
}: {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
  workflowTypeId: string;
  version: number;
  readOnly?: boolean;
}) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<WorkflowDraftFormValues>();
  const areaId = watch('general.areaId');
  const areaName = watch('general.areaName');
  const currentIconName = watch('general.icon') || 'FileText';
  const currentOwnerUserId = watch('general.ownerUserId');
  const currentOwnerEmail = watch('general.ownerEmail');
  const contextualInputClassName = 'bg-muted/30';
  const resolvedAreaName = areas.find((area) => area.areaId === areaId)?.name || areaName || areaId;
  const currentOwner = owners.find((owner) => owner.userId === currentOwnerUserId);
  const normalizedOwners = owners.filter((owner) => owner.userId.trim() !== '');
  const ownerOptions = currentOwner
    ? normalizedOwners
    : [
        {
          collaboratorDocId: undefined,
          userId: currentOwnerUserId,
          name: currentOwnerEmail || currentOwnerUserId || 'Owner atual',
          email: currentOwnerEmail || '',
        },
        ...normalizedOwners,
      ].filter((owner) => owner.userId.trim() !== '');
  const iconOptions = iconList.includes(currentIconName) ? iconList : [currentIconName, ...iconList];

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
          <Input id="draft-name" disabled={readOnly} {...register('general.name')} />
          {errors.general?.name ? <p className="text-sm text-destructive">{errors.general.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-description">Descricao</Label>
          <Textarea id="draft-description" rows={3} disabled={readOnly} {...register('general.description')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Area</Label>
            <Input
              value={resolvedAreaName}
              readOnly
              className={contextualInputClassName}
            />
            <p className="text-xs text-muted-foreground">A area e herdada do workflow type e nao pode ser alterada aqui.</p>
          </div>

          <div className="space-y-2">
            <Label>Icone</Label>
            <Controller
              name="general.icon"
              control={control}
              render={({ field }) => {
                const selectedIconName = field.value || currentIconName || 'FileText';
                const Icon = getIcon(selectedIconName);
                const availableIconOptions = iconList.includes(selectedIconName)
                  ? iconOptions
                  : [selectedIconName, ...iconOptions];

                return (
                  <Select value={selectedIconName} onValueChange={field.onChange} disabled={readOnly}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{selectedIconName}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {availableIconOptions.map((iconName) => {
                          const ItemIcon = getIcon(iconName);

                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                <ItemIcon className="h-4 w-4" />
                                <span>{iconName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Owner</Label>
            <Controller
              name="general.ownerUserId"
              control={control}
              render={({ field }) => {
                const selectedOwnerUserId = field.value || currentOwnerUserId;
                const selectedOwner =
                  ownerOptions.find((owner) => owner.userId === selectedOwnerUserId) ||
                  (selectedOwnerUserId
                    ? {
                        collaboratorDocId: undefined,
                        userId: selectedOwnerUserId,
                        name: currentOwner?.name || currentOwnerEmail || selectedOwnerUserId,
                        email: currentOwner?.email || currentOwnerEmail || '',
                      }
                    : null);
                const availableOwnerOptions =
                  selectedOwner && !ownerOptions.some((owner) => owner.userId === selectedOwner.userId)
                    ? [selectedOwner, ...ownerOptions]
                    : ownerOptions;

                return (
                  <Select value={selectedOwnerUserId} onValueChange={field.onChange} disabled={readOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um owner">
                        {selectedOwnerUserId ? (
                          <div className="flex min-w-0 flex-col items-start text-left">
                            <span className="truncate">{selectedOwner?.name || selectedOwnerUserId}</span>
                            {selectedOwner?.email ? (
                              <span className="truncate text-xs text-muted-foreground">{selectedOwner.email}</span>
                            ) : null}
                          </div>
                        ) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableOwnerOptions.map((owner) => (
                        <SelectItem key={owner.userId} value={owner.userId}>
                          <div className="flex min-w-0 flex-col items-start text-left">
                            <span className="truncate">{owner.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{owner.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft-sla">SLA padrao (dias)</Label>
            <Input
              id="draft-sla"
              type="number"
              min={0}
              disabled={readOnly}
              {...register('general.defaultSlaDays', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-owner-email">Owner email</Label>
          <Input id="draft-owner-email" {...register('general.ownerEmail')} readOnly className={contextualInputClassName} />
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
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
