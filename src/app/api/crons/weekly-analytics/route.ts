import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) {
    return NextResponse.json({ message: "No active creators" });
  }

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  let generated = 0;
  for (const creator of creators) {
    try {
      // Refresh posts first
      await fetch(`${baseUrl}/api/import/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: creator.user_id }),
      });

      // Generate analytics report
      await fetch(`${baseUrl}/api/analytics/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: creator.user_id, type: "weekly" }),
      });

      generated++;
      await new Promise((r) => setTimeout(r, 5000));
    } catch {}
  }

  return NextResponse.json({ message: `Generated analytics for ${generated} creators` });
}
