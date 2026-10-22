import { cookies } from "next/headers";
import { visitorFrom } from "./store";

export const VISITOR_COOKIE = "oap_vid";

// Read-only lookup for pages; the API route issues the cookie and also checks
// the browser fingerprint sent with each research request.
export async function currentVisitor() {
  const id = (await cookies()).get(VISITOR_COOKIE)?.value;
  return visitorFrom(id ?? "no-cookie-yet");
}
