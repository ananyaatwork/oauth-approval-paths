import { STORE_KIND } from "@/lib/store";
import { searchConfigured } from "@/lib/research/search";
import { writerConfigured } from "@/lib/research/write";

export const dynamic = "force-dynamic";

// Which parts of live research are set up on this deployment. Never shows keys.
export function GET() {
  return Response.json({
    store: STORE_KIND,
    storeDurable: STORE_KIND === "redis" || !process.env.VERCEL,
    search: searchConfigured(),
    writer: writerConfigured(),
  });
}
