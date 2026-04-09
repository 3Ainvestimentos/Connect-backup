import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkflowDraftFormValues } from './WorkflowDraftEditorPage';

const fieldTypes = ['text', 'textarea', 'select', 'date', 'date-range', 'file'] as const;

export function WorkflowDraftFieldsSection() {
  const { control, register, setValue, watch } = useFormContext<WorkflowDraftFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });
  const values = watch('fields');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Campos do formulario</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: '',
              label: '',
              type: 'text',
              required: false,
              order: fields.length + 1,
              placeholder: '',
              options: [],
            })
          }
        >
          Adicionar campo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum campo cadastrado.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Campo {index + 1}</p>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rotulo</Label>
                  <Input {...register(`fields.${index}.label`)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={values?.[index]?.type || 'text'}
                    onValueChange={(value) => setValue(`fields.${index}.type`, value as WorkflowDraftFormValues['fields'][number]['type'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input {...register(`fields.${index}.placeholder`)} />
              </div>

              {values?.[index]?.type === 'select' ? (
                <div className="space-y-2">
                  <Label>Opcoes</Label>
                  <Input
                    value={(values?.[index]?.options || []).join(', ')}
                    onChange={(event) =>
                      setValue(
                        `fields.${index}.options`,
                        event.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                        { shouldDirty: true },
                      )
                    }
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values?.[index]?.required === true}
                  onCheckedChange={(checked) => setValue(`fields.${index}.required`, checked === true, { shouldDirty: true })}
                />
                Campo obrigatorio
              </label>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
