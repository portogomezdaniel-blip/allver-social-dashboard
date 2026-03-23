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
  created_at: string;
}

export async function fetchTodayNews(): Promise<DailyNews[]> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_news")
    .select("*")
    .eq("news_date", today)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNewsByDate(date: string): Promise<DailyNews[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_news")
    .select("*")
    .eq("news_date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function markNewsAsUsed(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("daily_news").update({ used_as_post: true }).eq("id", id);
}
