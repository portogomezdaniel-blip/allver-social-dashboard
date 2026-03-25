import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) {
    return NextResponse.json({ message: "No active creators" });
  }

  // Use Colombia time (UTC-5)
  const now = new Date();
  const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const today = colombiaTime.toISOString().split("T")[0];
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  let generated = 0;

  for (const creator of creators) {
    // Check if already has 3 news today
    const { count } = await supabase
      .from("daily_news")
      .select("*", { count: "exact", head: true })
      .eq("user_id", creator.user_id)
      .eq("news_date", today);

    if ((count || 0) >= 3) continue;

    await fetch(`${baseUrl}/api/agents/daily-news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: creator.user_id }),
    });

    generated++;

    // Wait 5 seconds between users
    if (generated < creators.length) {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  return NextResponse.json({
    message: `Generated news for ${generated}/${creators.length} creators`,
  });
}
