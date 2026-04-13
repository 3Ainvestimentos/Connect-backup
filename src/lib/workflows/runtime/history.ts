/**
 * @fileOverview History entry builder for the v2 workflow runtime.
 *
 * Every mutation on a request document must append a history entry.
 * History is append-only.
 */

import { Timestamp } from 'firebase-admin/firestore';
import type { HistoryAction, HistoryEntry } from './types';

/**
 * Creates a history entry with the current server timestamp.
 *
 * @param action  - A machine-readable action label (e.g. 'request_opened', 'responsible_assigned').
 * @param userId  - The UID of the actor.
 * @param userName - Display name of the actor.
 * @param details - Optional extra information about the event.
 * @returns A new HistoryEntry.
 */
export function buildHistoryEntry(
  action: HistoryAction,
  userId: string,
  userName: string,
  details?: Record<string, unknown>,
  timestamp: Timestamp = Timestamp.now(),
): HistoryEntry {
  return {
    action,
    timestamp,
    userId,
    userName,
    ...(details ? { details } : {}),
  };
}
