import type { VersionFieldDef } from '@/lib/workflows/runtime/types';
import type { Fase2cManifestEntry, LegacyWorkflowField, NormalizedFieldsResult } from './types';

function buildDeterministicPlaceholder(field: LegacyWorkflowField, trimmedLabel: string): string {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return `Insira ${trimmedLabel}`;
    case 'select':
      return `Selecione ${trimmedLabel}`;
    case 'date':
      return `Informe ${trimmedLabel}`;
    case 'file':
      return `Anexe ${trimmedLabel}`;
    default:
      return trimmedLabel;
  }
}

function resolveOverrideId(
  originalId: string,
  entry: Fase2cManifestEntry,
  overrideUsage: Map<string, number>,
): string {
  const overrides = entry.fieldIdOverrides?.[originalId];

  if (!overrides) {
    return originalId;
  }

  const nextIndex = overrideUsage.get(originalId) ?? 0;

  if (nextIndex >= overrides.length) {
    throw new Error(
      `Override de field.id insuficiente para "${entry.workflowTypeId}" em "${originalId}".`,
    );
  }

  overrideUsage.set(originalId, nextIndex + 1);

  return overrides[nextIndex].trim();
}

function assertOverridesConsumed(
  workflowTypeId: string,
  overrides: Record<string, string[]> | undefined,
  overrideUsage: Map<string, number>,
): void {
  if (!overrides) {
    return;
  }

  for (const [originalId, values] of Object.entries(overrides)) {
    const used = overrideUsage.get(originalId) ?? 0;

    if (used !== values.length) {
      throw new Error(
        `Override de field.id inconsistente para "${workflowTypeId}" em "${originalId}": usados ${used}, configurados ${values.length}.`,
      );
    }
  }
}

export function normalizeFields(
  entry: Fase2cManifestEntry,
  legacyFields: LegacyWorkflowField[],
): NormalizedFieldsResult {
  if (!legacyFields.length) {
    return {
      fields: [],
      sanitizations: ['fields=[] preservado do snapshot legado'],
    };
  }

  const sanitizations: string[] = [];
  const normalizedFields: VersionFieldDef[] = [];
  const seenIds = new Set<string>();
  const overrideUsage = new Map<string, number>();

  for (const [index, field] of legacyFields.entries()) {
    const originalId = field.id.trim();
    const resolvedId = resolveOverrideId(originalId, entry, overrideUsage);

    if (field.id !== originalId) {
      sanitizations.push(`field.id trimmed: "${field.id}" -> "${originalId}"`);
    }

    if (resolvedId !== originalId) {
      sanitizations.push(`field.id override: "${originalId}" -> "${resolvedId}"`);
    }

    if (seenIds.has(resolvedId)) {
      throw new Error(
        `Duplicidade de field.id sem cobertura de override em "${entry.workflowTypeId}": "${resolvedId}".`,
      );
    }

    seenIds.add(resolvedId);

    const label = field.label.trim();
    const rawPlaceholder = field.placeholder ?? '';
    const trimmedPlaceholder = rawPlaceholder.trim();
    const placeholder =
      trimmedPlaceholder !== ''
        ? trimmedPlaceholder
        : buildDeterministicPlaceholder(field, label);

    if (field.label !== label) {
      sanitizations.push(`field.label trimmed: "${field.id}"`);
    }

    if (rawPlaceholder !== placeholder) {
      sanitizations.push(`field.placeholder normalized: "${resolvedId}"`);
    }

    normalizedFields.push({
      id: resolvedId,
      label,
      type: field.type,
      required: field.required,
      order: index + 1,
      placeholder,
      options: Array.isArray(field.options) && field.options.length > 0 ? [...field.options] : undefined,
    });
  }

  assertOverridesConsumed(entry.workflowTypeId, entry.fieldIdOverrides, overrideUsage);

  return {
    fields: normalizedFields,
    sanitizations,
  };
}

