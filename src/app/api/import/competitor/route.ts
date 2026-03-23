import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeInstagramPosts } from "@/lib/apify";

export async function POST(req: NextRequest) {
  try {
    const { userId, handle } = await req.json();
    if (!userId || !handle) {
      return NextResponse.json({ error: "userId and handle required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cleanHandle = handle.replace("@", "").trim();

    // Scrape with Apify
    let profile = null;
    let posts: { caption: string; likesCount: number; commentsCount: number; videoViewCount?: number; type: string; timestamp: string; url: string; displayUrl: string; hashtags: string[]; id: string }[] = [];

    if (process.env.APIFY_API_TOKEN) {
      try {
        const result = await scrapeInstagramPosts(cleanHandle, 20);
        profile = result.profile;
        posts = result.posts;
      } catch {
        // Apify failed — create competitor without posts
      }
    }

    // Calculate engagement
    const totalEngagement = posts.reduce((sum, p) => sum + p.likesCount + p.commentsCount, 0);
    const avgEng =
      posts.length > 0 && (profile?.followersCount || 0) > 0
        ? Math.round((totalEngagement / posts.length / (profile!.followersCount || 1)) * 10000) / 100
        : 0;
    const weeksOfData = Math.max(1, Math.ceil(posts.length / 7));

    // Check if competitor exists
    const { data: existing } = await supabase
      .from("competitors")
      .select("id")
      .eq("user_id", userId)
      .eq("handle", `@${cleanHandle}`)
      .single();

    let competitorId: string;

    const competitorData = {
      user_id: userId,
      handle: `@${cleanHandle}`,
      name: profile?.fullName || cleanHandle,
      platform: "instagram" as const,
      followers: profile?.followersCount || 0,
      followers_change: 0,
      avg_engagement: avgEng,
      posts_per_week: Math.round(posts.length / weeksOfData),
      last_scraped_at: new Date().toISOString(),
      profile_pic_url: profile?.profilePicUrl || null,
      bio: profile?.biography || null,
      posts_count: profile?.postsCount || 0,
      is_active: true,
    };

    if (existing) {
      await supabase.from("competitors").update(competitorData).eq("id", existing.id);
      await supabase.from("competitor_posts").delete().eq("competitor_id", existing.id);
      competitorId = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("competitors")
        .insert(competitorData)
        .select("id")
        .single();
      if (error || !inserted) {
        return NextResponse.json({ error: error?.message || "Failed to create competitor" }, { status: 500 });
      }
      competitorId = inserted.id;
    }

    // Insert competitor posts
    if (posts.length > 0) {
      const postRows = posts
        .filter((p) => p.caption)
        .map((p) => ({
          competitor_id: competitorId,
          user_id: userId,
          instagram_post_id: p.id || null,
          post_url: p.url || null,
          caption: p.caption?.slice(0, 5000) || null,
          post_type: p.type || "Image",
          likes_count: p.likesCount || 0,
          comments_count: p.commentsCount || 0,
          views_count: p.videoViewCount || null,
          posted_at: p.timestamp || null,
          thumbnail_url: p.displayUrl || null,
          hashtags: p.hashtags || null,
          engagement_rate:
            (profile?.followersCount || 0) > 0
              ? Math.round(((p.likesCount || 0) + (p.commentsCount || 0)) / profile!.followersCount * 10000) / 100
              : null,
        }));

      await supabase.from("competitor_posts").insert(postRows);
    }

    return NextResponse.json({
      success: true,
      competitorId,
      handle: `@${cleanHandle}`,
      name: profile?.fullName || cleanHandle,
      followers: profile?.followersCount || 0,
      postsScraped: posts.length,
      avgEngagement: avgEng,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
