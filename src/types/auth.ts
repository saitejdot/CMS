/**
 * Authenticated principal returned by requireAdmin().
 * Represents the verified identity extracted from a valid admin JWT.
 * Never trust these values from the client — they come from server-side
 * JWT verification only.
 */
export interface AdminPrincipal {
  /** Subject — always "admin" for the single-admin system */
  sub: string;
  /** Role — always "admin" for the single-admin system */
  role: "admin";
  /** Unique token identifier (jti claim) */
  jti: string;
  /** Token expiry as a Unix timestamp */
  exp: number;
}
