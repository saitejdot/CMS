/**
 * Request ID utility for server-side observability.
 *
 * Assigns a unique ID to each request so log lines from the
 * same request can be correlated. Never log secrets, JWTs,
 * passwords, or personal information alongside request IDs.
 *
 * Usage:
 *   const reqId = generateRequestId();
 *   console.error(`[${reqId}] Blog create failed:`, errorMessage);
 */

export function generateRequestId(): string {
  return crypto.randomUUID();
}
