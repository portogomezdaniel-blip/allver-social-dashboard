import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeInstagramPosts } from "@/lib/apify";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get user's Instagram handle
    const { data: creator } = await supabase.from("creators").select("*").eq("id", userId).single();
    const { data: identity } = await supabase.from("creator_identity").select("*").eq("user_id", userId).single();

    // Try to find handle from various sources
    let handle = "";
    if (creator?.instagram_handle) handle = creator.instagram_handle;
    else {
      // Check if we have posts with ownerUsername
      const { data: existingPosts } = await supabase
        .from("posts")
        .select("caption")
        .eq("user_id", userId)
        .eq("status", "published")
        .limit(1);
      if (!existingPosts?.length) {
        return NextResponse.json({ error: "No Instagram handle found. Complete onboarding first." }, { status: 400 });
      }
    }

    if (!handle || !process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: "Instagram handle or Apify token not configured" }, { status: 400 });
    }

    const cleanHandle = handle.replace("@", "").trim();

    // Scrape latest 10 posts
    const { posts } = await scrapeInstagramPosts(cleanHandle, 10);

    // Get existing post captions for dedup
    const { data: existingPosts } = await supabase
      .from("posts")
      .select("caption")
      .eq("user_id", userId)
      .eq("status", "published");

    const existingCaptions = new Set((existingPosts ?? []).map((p) => p.caption?.slice(0, 100)));

    // Filter only new posts
    const newPosts = posts.filter((p) => p.caption && !existingCaptions.has(p.caption.slice(0, 100)));

    let inserted = 0;
    if (newPosts.length > 0) {
      const rows = newPosts.map((p) => ({
        user_id: userId,
        caption: p.caption.slice(0, 5000),
        post_type: p.type === "Video" ? "reel" : p.type === "Sidecar" ? "carousel" : "single",
        status: "published",
        platform: "instagram",
        scheduled_date: p.timestamp ? p.timestamp.split("T")[0] : null,
      }));

      const { error } = await supabase.from("posts").insert(rows);
      if (!error) inserted = rows.length;

      // Extract hooks from new posts
      const hookRows = newPosts
        .filter((p) => p.caption.length > 10)
        .map((p) => ({
          user_id: userId,
          text: p.caption.split(/[.!?\n]/)[0].trim(),
          source: "extracted",
          category: "extracted",
          engagement_score: p.likesCount + p.commentsCount,
        }))
        .filter((h) => h.text.length >= 10);

      if (hookRows.length > 0) {
        await supabase.from("hooks").insert(hookRows);
      }
    }

    return NextResponse.json({
      newPostsFound: newPosts.length,
      inserted,
      totalScraped: posts.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
