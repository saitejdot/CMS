/**
 * CSRF / Origin validation utility.
 *
 * Strategy:
 *   SameSite=Lax cookie  →  prevents cross-site cookie sending for most cases
 *   Origin header check  →  explicit allowlist for state-changing requests
 *
 * Why no stateful CSRF tokens:
 *   The admin cookie uses SameSite=Lax, which blocks cross-site POST requests
 *   from sending the cookie in modern browsers. Combined with strict Origin
 *   validation server-side, this is robust for a single-admin personal CMS
 *   without the complexity of synchroniser token patterns.
 *
 * State-changing GET requests: structurally prohibited — all mutations use POST.
 *
 * Usage:
 *   const csrfError = checkCSRF(request);
 *   if (csrfError) return csrfError;
 */

import { NextResponse } from "next/server";

function getAllowedOrigins(): string[] {
  const origins: string[] = ["http://localhost:3000"];

  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) {
    // Normalise: strip trailing slash
    origins.push(base.replace(/\/$/, ""));
  }

  return origins;
}

export function checkCSRF(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");

  // If there is no Origin header (e.g. same-origin server-to-server call
  // or curl without explicit Origin), allow if Referer also absent.
  // Browsers always send Origin on cross-origin requests; absence on a
  // same-origin navigation is acceptable.
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) {
      // Direct API call with no browser context — allow (admin CLI usage)
      return null;
    }
    // Referer present but no Origin — validate Referer host
    try {
      const refUrl = new URL(referer);
      const allowed = getAllowedOrigins().some((o) => {
        try {
          return new URL(o).host === refUrl.host;
        } catch {
          return false;
        }
      });
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: "Forbidden: invalid referer" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Forbidden: invalid referer" },
        { status: 403 }
      );
    }
    return null;
  }

  // Origin header is present — validate against allowlist
  const normalised = origin.replace(/\/$/, "");
  const allowed = getAllowedOrigins().includes(normalised);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Forbidden: origin not allowed" },
      { status: 403 }
    );
  }

  return null;
}
