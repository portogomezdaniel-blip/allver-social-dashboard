import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no CRON_SECRET is set
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all active creators
  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) {
    return NextResponse.json({ message: "No active creators" });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  for (const creator of creators) {
    await fetch(`${baseUrl}/api/agents/daily-news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: creator.user_id }),
    });
  }

  return NextResponse.json({ message: `Generated news for ${creators.length} creators` });
}
