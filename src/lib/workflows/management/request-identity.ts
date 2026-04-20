type CollaboratorLike = {
  id3a?: string | null;
  name: string;
};

export type OperationalIdentity = {
  identityKey: string;
  displayLabel: string;
};

const FALLBACK_IDENTITY_KEY = 'configured-collaborator';

export function resolveOperationalIdentity(input: {
  collaborators?: CollaboratorLike[];
  userId?: string | null;
  fallbackName?: string | null;
}): OperationalIdentity {
  const { collaborators = [], userId, fallbackName } = input;
  const trimmedFallbackName = fallbackName?.trim();

  if (trimmedFallbackName) {
    return {
      identityKey: userId?.trim() || trimmedFallbackName,
      displayLabel: trimmedFallbackName,
    };
  }

  const trimmedUserId = userId?.trim();
  const collaborator = collaborators.find((item) => item.id3a === trimmedUserId);
  const collaboratorName = collaborator?.name?.trim();

  if (collaboratorName) {
    return {
      identityKey: trimmedUserId || collaboratorName,
      displayLabel: collaboratorName,
    };
  }

  if (trimmedUserId) {
    return {
      identityKey: trimmedUserId,
      displayLabel: trimmedUserId,
    };
  }

  return {
    identityKey: FALLBACK_IDENTITY_KEY,
    displayLabel: 'Colaborador configurado',
  };
}
