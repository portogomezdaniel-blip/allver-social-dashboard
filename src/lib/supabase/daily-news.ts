import { createClient } from "./client";

export interface DailyNews {
  id: string;
  user_id: string;
  news_date: string;
  title: string;
  source: string | null;
  source_url: string | null;
  summary: string;
  relevance: string | null;
  suggested_hook: string;
  suggested_format: string | null;
  used_as_post: boolean;
  category: string | null;
  unique_angle: string | null;
  urgency: string | null;
  content_idea: string | null;
  image_url: string | null;
  created_at: string;
}

export interface NewsConnection {
  news_indices: number[];
  combined_idea: string;
  format: string;
  hook: string;
}

export interface DailyNewsMeta {
  id: string;
  connections: NewsConnection[];
  thread_idea: { title: string; posts: string[] } | null;
}

export async function fetchTodayNews(): Promise<DailyNews[]> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase.from("daily_news").select("*").eq("news_date", today).order("created_at", { ascending: true });
  return data ?? [];
}

export async function fetchNewsByDate(date: string): Promise<DailyNews[]> {
  const supabase = createClient();
  const { data } = await supabase.from("daily_news").select("*").eq("news_date", date).order("created_at", { ascending: true });
  return data ?? [];
}

export async function fetchTopHotNews(limit: number = 3): Promise<DailyNews[]> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase.from("daily_news").select("*").eq("news_date", today).order("urgency", { ascending: true }).limit(limit);
  return data ?? [];
}

export async function fetchTodayMeta(): Promise<DailyNewsMeta | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase.from("daily_news_meta").select("*").eq("meta_date", today).single();
  return data;
}

export async function markNewsAsUsed(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("daily_news").update({ used_as_post: true }).eq("id", id);
}
