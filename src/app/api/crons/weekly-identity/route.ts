import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get users with 3+ journal entries this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) return NextResponse.json({ message: "No creators" });

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  let evolved = 0;

  for (const creator of creators) {
    const { count } = await supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", creator.user_id)
      .eq("status", "completed")
      .gte("entry_date", weekAgo.toISOString().split("T")[0]);

    if ((count || 0) >= 3) {
      try {
        await fetch(`${baseUrl}/api/agents/evolve-identity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: creator.user_id }),
        });
        evolved++;
        await new Promise((r) => setTimeout(r, 5000));
      } catch {}
    }
  }

  return NextResponse.json({ message: `Evolved identity for ${evolved} creators` });
}
