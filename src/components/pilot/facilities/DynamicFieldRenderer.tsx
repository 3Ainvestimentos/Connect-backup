'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DynamicFormValue, PilotWorkflowField } from '@/lib/workflows/pilot/types';

type DynamicFieldRendererProps = {
  definition: PilotWorkflowField;
  value: DynamicFormValue;
  onChange: (value: DynamicFormValue) => void;
  disabled?: boolean;
  error?: string;
};

export function DynamicFieldRenderer({
  definition,
  value,
  onChange,
  disabled = false,
  error,
}: DynamicFieldRendererProps) {
  const inputId = `pilot-field-${definition.id}`;
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedFile = value instanceof File ? value : null;

  React.useEffect(() => {
    if (definition.type === 'file' && !selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [definition.type, selectedFile]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {definition.label}
        {definition.required ? ' *' : ''}
      </Label>

      {definition.type === 'text' ? (
        <Input
          id={inputId}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {definition.type === 'textarea' ? (
        <Textarea
          id={inputId}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {definition.type === 'select' ? (
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={inputId} aria-label={definition.label}>
            <SelectValue placeholder={definition.placeholder ?? 'Selecione uma opcao'} />
          </SelectTrigger>
          <SelectContent>
            {(definition.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {definition.type === 'file' ? (
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            id={inputId}
            type="file"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
          />
          <p className="text-sm text-muted-foreground">
            {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : 'Nenhum arquivo selecionado.'}
          </p>
        </div>
      ) : null}

      {definition.type !== 'text' &&
        definition.type !== 'textarea' &&
        definition.type !== 'select' &&
        definition.type !== 'file' ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          Tipo de campo "{definition.type}" ainda nao suportado neste piloto.
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
