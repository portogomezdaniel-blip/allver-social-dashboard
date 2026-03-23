import { createClient } from "./client";

export interface CompetitorPost {
  id: string;
  competitor_id: string;
  user_id: string;
  instagram_post_id: string | null;
  post_url: string | null;
  caption: string | null;
  post_type: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  posted_at: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  engagement_rate: number | null;
  scraped_at: string;
}

export async function fetchCompetitorPosts(
  competitorId: string
): Promise<CompetitorPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitor_posts")
    .select("*")
    .eq("competitor_id", competitorId)
    .order("posted_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function insertCompetitorPosts(
  posts: Omit<CompetitorPost, "id" | "scraped_at">[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("competitor_posts").insert(posts);
  if (error) throw error;
}
