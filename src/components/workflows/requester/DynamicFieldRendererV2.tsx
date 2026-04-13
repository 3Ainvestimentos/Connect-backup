'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { WorkflowPublishedField } from '@/lib/workflows/catalog/types';

type DynamicFieldRendererV2Props = {
  definition: WorkflowPublishedField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
};

function DateField({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const selectedDate = typeof value === 'string' && value ? new Date(value + 'T00:00:00') : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder || 'Selecione uma data'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

function DateRangeField({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const rangeValue =
    typeof value === 'object' && value !== null
      ? (value as { startDate?: string; endDate?: string })
      : {};

  const startDate =
    typeof rangeValue.startDate === 'string' && rangeValue.startDate
      ? new Date(rangeValue.startDate + 'T00:00:00')
      : undefined;
  const endDate =
    typeof rangeValue.endDate === 'string' && rangeValue.endDate
      ? new Date(rangeValue.endDate + 'T00:00:00')
      : undefined;

  const handleSelect = (date: Date | undefined, type: 'startDate' | 'endDate') => {
    const currentRange = typeof value === 'object' && value !== null ? (value as Record<string, string>) : {};
    onChange({
      startDate: type === 'startDate' ? (date ? format(date, 'yyyy-MM-dd') : '') : (currentRange.startDate || ''),
      endDate: type === 'endDate' ? (date ? format(date, 'yyyy-MM-dd') : '') : (currentRange.endDate || ''),
    });
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !startDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? (
              format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : (
              <span>Data inicio</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => handleSelect(date, 'startDate')}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !endDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? (
              format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : (
              <span>Data fim</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => handleSelect(date, 'endDate')}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DynamicFieldRendererV2({
  definition,
  value,
  onChange,
  disabled = false,
  error,
}: DynamicFieldRendererV2Props) {
  const inputId = `field-${definition.id}`;
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

      {definition.type === 'date' ? (
        <DateField
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={definition.placeholder}
        />
      ) : null}

      {definition.type === 'date-range' ? (
        <DateRangeField value={value} onChange={onChange} disabled={disabled} />
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
        definition.type !== 'date' &&
        definition.type !== 'date-range' &&
        definition.type !== 'file' ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          Tipo de campo &quot;{definition.type}&quot; ainda nao suportado neste renderer.
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
