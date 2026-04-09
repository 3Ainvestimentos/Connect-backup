function slugify(value: string, separator: '-' | '_' = '-') {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
    .replace(new RegExp(`${separator}+`, 'g'), separator);

  return normalized || 'item';
}

export function buildAreaId(name: string) {
  return slugify(name.trim(), '-');
}

export function buildWorkflowTypeId(areaId: string, name: string) {
  return `${slugify(areaId.trim(), '_')}_${slugify(name.trim(), '_')}`;
}

export function buildFieldId(label: string) {
  return slugify(label.trim(), '_');
}

export function buildStatusKey(stepName: string) {
  return slugify(stepName.trim(), '_');
}

export function appendNumericSuffix(baseId: string, suffix: number, separator: '-' | '_' = '-') {
  return `${baseId}${separator}${suffix}`;
}
