import { cookies, headers } from "next/headers";
import { visitorFrom } from "./store";

export const VISITOR_COOKIE = "oap_vid";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

// Read-only lookup for pages; the API route is what issues the cookie.
export async function currentVisitor() {
  const id = (await cookies()).get(VISITOR_COOKIE)?.value;
  return visitorFrom(id ?? "no-cookie-yet", await clientIp());
}
