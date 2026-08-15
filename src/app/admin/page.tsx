/**
 * /admin — Admin Dashboard page (Server Component)
 *
 * Verifies the admin JWT cookie before rendering the dashboard.
 * Redirects to /admin/login if the cookie is absent or invalid.
 *
 * This is the page-level auth check. The individual API routes
 * independently call requireAdmin() as defence-in-depth.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import AdminClient from "@/components/AdminClient";

const COOKIE_NAME = "admin_token";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/admin/login");
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if ((payload as Record<string, unknown>).role !== "admin") {
      redirect("/admin/login");
    }
  } catch {
    // Expired or invalid token
    redirect("/admin/login");
  }

  return <AdminClient />;
}