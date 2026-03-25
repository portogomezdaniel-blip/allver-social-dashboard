import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // 5 minutes max for Vercel

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use Colombia time for date calculation (UTC-5)
  const now = new Date();
  const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const today = colombiaTime.toISOString().split("T")[0];
  const dayOfWeek = colombiaTime.getDay(); // 0=Sun, 1=Mon

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://allver-social-dashboard.vercel.app";

  const log: Record<string, unknown> = { date: today, dayOfWeek };

  // Get active creators
  const { data: creators } = await supabase
    .from("creator_identity")
    .select("user_id")
    .eq("onboarding_status", "completed");

  if (!creators || creators.length === 0) {
    return NextResponse.json({ message: "No active creators", ...log });
  }

  log.creators = creators.length;

  // === DAILY: News + Content for each creator ===
  let newsGenerated = 0;
  let contentGenerated = 0;

  for (const creator of creators) {
    // 1. Daily News — check if already has 3 today
    const { count: newsCount } = await supabase
      .from("daily_news")
      .select("*", { count: "exact", head: true })
      .eq("user_id", creator.user_id)
      .eq("news_date", today);

    if ((newsCount || 0) < 3) {
      try {
        await fetch(`${baseUrl}/api/agents/daily-news`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: creator.user_id }),
        });
        newsGenerated++;
      } catch (e) {
        log[`news_error_${creator.user_id}`] = e instanceof Error ? e.message : "error";
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    // 2. Daily Content Suggestion — check if already has one today
    const { data: existingSuggestion } = await supabase
      .from("daily_suggestions")
      .select("id")
      .eq("user_id", creator.user_id)
      .eq("suggestion_date", today)
      .limit(1);

    if (!existingSuggestion?.length) {
      try {
        await fetch(`${baseUrl}/api/agents/daily-content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: creator.user_id }),
        });
        contentGenerated++;
      } catch (e) {
        log[`content_error_${creator.user_id}`] = e instanceof Error ? e.message : "error";
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  log.newsGenerated = newsGenerated;
  log.contentGenerated = contentGenerated;

  // === WEEKLY (Monday only): Hooks + Recon + Analytics + Identity ===
  if (dayOfWeek === 1) {
    // Weekly Hooks — extract from recent posts
    let hooksExtracted = 0;
    for (const creator of creators) {
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

      if (!posts?.length) continue;

      for (const post of posts) {
        const firstSentence = post.caption.split(/[.!?\n]/)[0].trim();
        if (firstSentence.length < 10) continue;

        const { data: existing } = await supabase
          .from("hooks")
          .select("id")
          .eq("user_id", creator.user_id)
          .eq("text", firstSentence)
          .limit(1);

        if (existing?.length) continue;

        await supabase.from("hooks").insert({
          user_id: creator.user_id,
          text: firstSentence,
          source: "extracted",
          source_post_id: post.id,
          category: "extracted",
        });
        hooksExtracted++;
      }
    }
    log.hooksExtracted = hooksExtracted;

    // Weekly Recon — re-scrape competitors
    const { data: competitors } = await supabase
      .from("competitors")
      .select("id, user_id, handle")
      .eq("is_active", true);

    let reconUpdated = 0;
    if (competitors?.length) {
      for (const comp of competitors) {
        try {
          await fetch(`${baseUrl}/api/import/competitor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: comp.user_id, handle: comp.handle }),
          });
          reconUpdated++;
          await new Promise((r) => setTimeout(r, 10000));
        } catch {}
      }
    }
    log.reconUpdated = reconUpdated;

    // Weekly Analytics
    let analyticsGenerated = 0;
    for (const creator of creators) {
      try {
        await fetch(`${baseUrl}/api/import/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: creator.user_id }),
        });
        await fetch(`${baseUrl}/api/analytics/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: creator.user_id, type: "weekly" }),
        });
        analyticsGenerated++;
        await new Promise((r) => setTimeout(r, 5000));
      } catch {}
    }
    log.analyticsGenerated = analyticsGenerated;

    // Weekly Identity Evolution — only if 3+ journal entries this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let identityEvolved = 0;

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
          identityEvolved++;
          await new Promise((r) => setTimeout(r, 5000));
        } catch {}
      }
    }
    log.identityEvolved = identityEvolved;
  }

  return NextResponse.json({ success: true, ...log });
}
