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
  urgency: string | null;
  created_at: string;
}

const URGENCY_ORDER = ["hot", "warm", "evergreen"];

function sortByUrgency(news: DailyNews[]): DailyNews[] {
  return [...news].sort(
    (a, b) => URGENCY_ORDER.indexOf(a.urgency || "warm") - URGENCY_ORDER.indexOf(b.urgency || "warm")
  );
}

export async function fetchNewsByDate(date: string): Promise<DailyNews[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_news")
    .select("*")
    .eq("news_date", date)
    .order("created_at", { ascending: true });
  return sortByUrgency(data ?? []);
}

export async function fetchTodayNews(): Promise<DailyNews[]> {
  const today = new Date().toLocaleDateString("en-CA");
  return fetchNewsByDate(today);
}

export async function fetchTopHotNews(limit: number = 3): Promise<DailyNews[]> {
  const today = new Date().toLocaleDateString("en-CA");
  const news = await fetchNewsByDate(today);
  return news.slice(0, limit);
}

export async function markNewsAsUsed(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("daily_news").update({ used_as_post: true }).eq("id", id);
}
