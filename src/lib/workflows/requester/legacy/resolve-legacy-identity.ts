import type { User } from 'firebase/auth';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { findCollaboratorByEmail } from '@/lib/email-utils';

export interface LegacyIdentityResolution {
  id3a: string | null;
  resolved: boolean;
}

/**
 * Resolve o id3a do usuario corrente a partir da lista de colaboradores,
 * usando email normalizado (cobre @3ariva <-> @3ainvestimentos).
 *
 * Retorna `{ resolved: false }` quando a identidade nao puder ser resolvida
 * — nesse caso a origem legada contribui com lista vazia, sem quebrar a
 * experiencia do v2.
 */
export function resolveLegacyIdentity(
  user: User | null | undefined,
  collaborators: Collaborator[] | null | undefined,
): LegacyIdentityResolution {
  if (!user || !collaborators?.length) {
    return { id3a: null, resolved: false };
  }
  const match = findCollaboratorByEmail(collaborators, user.email);
  if (!match) return { id3a: null, resolved: false };
  return { id3a: match.id3a, resolved: true };
}
