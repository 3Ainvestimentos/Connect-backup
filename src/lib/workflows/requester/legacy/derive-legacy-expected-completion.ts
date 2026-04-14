import { addBusinessDays, format, parseISO, isValid } from 'date-fns';
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition, SlaRule } from '@/contexts/ApplicationsContext';

export interface DeriveLegacyExpectedCompletionResult {
  expectedCompletionAt: Date | null;
  expectedCompletionLabel: string;
}

/**
 * Porta direta da funcao `getSlaDate` de `MyRequests.tsx` para um helper puro.
 * Retorna sempre `{ expectedCompletionAt, expectedCompletionLabel }`, com
 * degradacao elegante (`null` / `'-'`) quando nao e possivel calcular.
 */
export function deriveLegacyExpectedCompletion(
  request: Pick<WorkflowRequest, 'submittedAt' | 'formData'>,
  definition: Pick<WorkflowDefinition, 'defaultSlaDays' | 'slaRules'> | null | undefined,
): DeriveLegacyExpectedCompletionResult {
  if (!definition) return { expectedCompletionAt: null, expectedCompletionLabel: '-' };

  let slaDays: number | undefined = definition.defaultSlaDays;
  const rules: SlaRule[] = definition.slaRules ?? [];

  for (const rule of rules) {
    const value = request.formData?.[rule.field];
    if (value != null && String(value) === rule.value) {
      slaDays = rule.days;
      break;
    }
  }

  if (typeof slaDays !== 'number') {
    return { expectedCompletionAt: null, expectedCompletionLabel: '-' };
  }

  const submissionDate = typeof request.submittedAt === 'string'
    ? parseISO(request.submittedAt)
    : null;

  if (!submissionDate || !isValid(submissionDate)) {
    return { expectedCompletionAt: null, expectedCompletionLabel: '-' };
  }

  const slaDate = addBusinessDays(submissionDate, slaDays);
  return {
    expectedCompletionAt: slaDate,
    expectedCompletionLabel: format(slaDate, 'dd/MM/yyyy'),
  };
}
