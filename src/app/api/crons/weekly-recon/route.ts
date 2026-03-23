import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all active competitors
  const { data: competitors } = await supabase
    .from("competitors")
    .select("id, user_id, handle")
    .eq("is_active", true);

  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ message: "No active competitors" });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  let updated = 0;

  for (const comp of competitors) {
    try {
      await fetch(`${baseUrl}/api/import/competitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: comp.user_id,
          handle: comp.handle,
        }),
      });
      updated++;
      // Wait 10s between scrapes to not burn Apify credits
      await new Promise((r) => setTimeout(r, 10000));
    } catch {
      // Continue with next competitor
    }
  }

  return NextResponse.json({ message: `Updated ${updated}/${competitors.length} competitors` });
}
