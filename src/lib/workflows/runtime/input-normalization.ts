/**
 * @fileOverview Input normalization layer for formData payloads.
 *
 * Rules (Etapa 1):
 * - If only `centrodecusto` is present, normalize to `centro_custo`.
 * - If both `centrodecusto` AND `centro_custo` are present, fail with a validation error.
 * - The persisted `formData` must always use the canonical key `centro_custo`.
 */

import { RuntimeError, RuntimeErrorCode } from './errors';

/**
 * Normalizes the form data payload so that legacy keys are mapped to canonical keys.
 *
 * @param formData - The raw form data submitted by the client.
 * @returns A new object with canonical keys only.
 * @throws {RuntimeError} If conflicting keys are found (e.g. both `centrodecusto` and `centro_custo`).
 */
export function normalizeFormData(formData: Record<string, unknown>): Record<string, unknown> {
  const hasLegacy = 'centrodecusto' in formData;
  const hasCanonical = 'centro_custo' in formData;

  if (hasLegacy && hasCanonical) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_FORM_DATA,
      'Conflito de campos: "centrodecusto" e "centro_custo" nao podem coexistir. Use apenas "centro_custo".',
    );
  }

  if (!hasLegacy) {
    return { ...formData };
  }

  // Normalize: copy all fields except the legacy key, add canonical key
  const { centrodecusto, ...rest } = formData;
  return { ...rest, centro_custo: centrodecusto };
}
