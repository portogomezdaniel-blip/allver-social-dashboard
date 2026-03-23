import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ScrapedPost {
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  type?: string;
  timestamp?: string;
  url?: string;
  hashtags?: string[];
}

interface ScrapedProfile {
  username?: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  profilePicUrl?: string;
  postsCount?: number;
  latestPosts?: ScrapedPost[];
}

async function scrapeCompetitorApify(handle: string): Promise<{ profile: ScrapedProfile | null; posts: ScrapedPost[] }> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return { profile: null, posts: [] };

  const cleanHandle = handle.replace("@", "").trim();

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${cleanHandle}/`],
          resultsLimit: 20,
          resultsType: "posts",
        }),
      }
    );

    if (!res.ok) return { profile: null, posts: [] };
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return { profile: null, posts: [] };

    const firstItem = data[0];
    const profile: ScrapedProfile = {
      username: firstItem.ownerUsername || cleanHandle,
      fullName: firstItem.ownerFullName || cleanHandle,
      biography: firstItem.ownerBiography || "",
      followersCount: firstItem.ownerFollowersCount || 0,
      profilePicUrl: firstItem.ownerProfilePicUrl || null,
      postsCount: firstItem.ownerPostsCount || 0,
    };

    return { profile, posts: data };
  } catch {
    return { profile: null, posts: [] };
  }
}

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
    const { profile, posts } = await scrapeCompetitorApify(cleanHandle);

    // Upsert competitor
    const competitorData = {
      user_id: userId,
      handle: `@${cleanHandle}`,
      name: profile?.fullName || cleanHandle,
      platform: "instagram" as const,
      followers: profile?.followersCount || 0,
      followers_change: 0,
      avg_engagement: 0,
      posts_per_week: 0,
      last_scraped_at: new Date().toISOString(),
      profile_pic_url: profile?.profilePicUrl || null,
      bio: profile?.biography || null,
      posts_count: profile?.postsCount || 0,
      is_active: true,
    };

    // Check if competitor already exists
    const { data: existing } = await supabase
      .from("competitors")
      .select("id")
      .eq("user_id", userId)
      .eq("handle", `@${cleanHandle}`)
      .single();

    let competitorId: string;

    if (existing) {
      await supabase
        .from("competitors")
        .update(competitorData)
        .eq("id", existing.id);
      competitorId = existing.id;

      // Delete old posts
      await supabase
        .from("competitor_posts")
        .delete()
        .eq("competitor_id", existing.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("competitors")
        .insert(competitorData)
        .select("id")
        .single();

      if (error || !inserted) {
        return NextResponse.json({ error: error?.message || "Failed to insert competitor" }, { status: 500 });
      }
      competitorId = inserted.id;
    }

    // Insert competitor posts
    if (posts.length > 0) {
      const totalEngagement = posts.reduce((sum, p) => sum + (p.likesCount || 0) + (p.commentsCount || 0), 0);
      const avgEng = posts.length > 0 && (profile?.followersCount || 0) > 0
        ? Math.round((totalEngagement / posts.length / (profile!.followersCount || 1)) * 10000) / 100
        : 0;

      // Update avg_engagement
      const weeksOfData = Math.max(1, Math.ceil(posts.length / 7));
      await supabase
        .from("competitors")
        .update({
          avg_engagement: avgEng,
          posts_per_week: Math.round(posts.length / weeksOfData),
        })
        .eq("id", competitorId);

      const postRows = posts
        .filter((p) => p.caption)
        .map((p) => ({
          competitor_id: competitorId,
          user_id: userId,
          instagram_post_id: null,
          post_url: p.url || null,
          caption: p.caption?.slice(0, 5000) || null,
          post_type: p.type || "Image",
          likes_count: p.likesCount || 0,
          comments_count: p.commentsCount || 0,
          views_count: p.videoViewCount || null,
          posted_at: p.timestamp || null,
          hashtags: p.hashtags || null,
          engagement_rate: (profile?.followersCount || 0) > 0
            ? Math.round(((p.likesCount || 0) + (p.commentsCount || 0)) / (profile!.followersCount || 1) * 10000) / 100
            : null,
        }));

      if (postRows.length > 0) {
        await supabase.from("competitor_posts").insert(postRows);
      }
    }

    return NextResponse.json({
      competitorId,
      handle: `@${cleanHandle}`,
      name: profile?.fullName || cleanHandle,
      followers: profile?.followersCount || 0,
      postsScraped: posts.length,
      hasApify: !!process.env.APIFY_API_TOKEN,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
