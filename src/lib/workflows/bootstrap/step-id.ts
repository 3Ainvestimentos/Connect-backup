/**
 * @fileOverview Step ID generator for the v2 workflow engine.
 *
 * Format: `stp_<shortId>` where shortId is a random 8-char alphanumeric string.
 * The ID is never derived from step name or position.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SHORT_ID_LENGTH = 8;

/**
 * Generates a unique step ID with the format `stp_<shortId>`.
 *
 * @returns A randomly generated step ID string.
 */
export function generateStepId(): string {
  let shortId = '';
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    shortId += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return `stp_${shortId}`;
}
