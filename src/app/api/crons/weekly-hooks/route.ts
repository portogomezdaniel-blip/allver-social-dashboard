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

  // Get all creators with completed identity
  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) {
    return NextResponse.json({ message: "No active creators" });
  }

  let totalExtracted = 0;

  for (const creator of creators) {
    // Get published posts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: posts } = await supabase
      .from("posts")
      .select("id, caption")
      .eq("user_id", creator.user_id)
      .eq("status", "published")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    if (!posts || posts.length === 0) continue;

    // Extract first sentence as hook
    for (const post of posts) {
      const firstSentence = post.caption.split(/[.!?\n]/)[0].trim();
      if (firstSentence.length < 10) continue;

      // Check if hook already exists
      const { data: existing } = await supabase
        .from("hooks")
        .select("id")
        .eq("user_id", creator.user_id)
        .eq("text", firstSentence)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("hooks").insert({
        user_id: creator.user_id,
        text: firstSentence,
        source: "extracted",
        source_post_id: post.id,
        category: "extracted",
      });

      totalExtracted++;
    }
  }

  return NextResponse.json({ message: `Extracted ${totalExtracted} hooks` });
}
