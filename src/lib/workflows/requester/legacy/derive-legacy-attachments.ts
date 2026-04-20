import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { RequesterUnifiedRequestDetailAttachment } from '../unified-types';

function getAttachmentFileName(url: string): string {
  const rawName = url.split('/').pop()?.split('?')[0] ?? 'Arquivo';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

/**
 * Extrai anexos de um request legado. O legado guarda o URL diretamente
 * em `formData[fieldId]` quando o campo e do tipo `'file'`.
 *
 * Degradacao elegante: quando a definicao nao esta disponivel, varre
 * `formData` procurando strings que se pareçam com URL e usa `fieldId`
 * como label.
 */
export function deriveLegacyAttachments(
  request: Pick<WorkflowRequest, 'formData'>,
  definition: Pick<WorkflowDefinition, 'fields'> | null | undefined,
): RequesterUnifiedRequestDetailAttachment[] {
  const formData = request.formData ?? {};
  const attachments: RequesterUnifiedRequestDetailAttachment[] = [];

  if (definition?.fields?.length) {
    for (const [index, field] of definition.fields.entries()) {
      if (field.type !== 'file') continue;
      const url = formData[field.id];
      if (typeof url !== 'string' || !url.trim()) continue;
      attachments.push({
        fieldId: field.id,
        label: field.label,
        url,
        fileName: getAttachmentFileName(url),
        order: index,
      });
    }
    return attachments;
  }

  // Fallback sem definicao: detecta strings que parecem URL
  for (const [index, [key, value]] of Object.entries(formData).entries()) {
    if (typeof value !== 'string') continue;
    if (!/^https?:\/\//i.test(value)) continue;
    attachments.push({
      fieldId: key,
      label: key,
      url: value,
      fileName: getAttachmentFileName(value),
      order: index,
    });
  }
  return attachments;
}
