import { createClient } from "./client";
import type { ScoredIdea } from "./program-output";
import type { DbPost } from "./posts";
import type { DailyNews } from "./daily-news";

// Ideas del mes (con scheduled_date en el rango)
export async function fetchMonthIdeas(monthStart: string, monthEnd: string): Promise<ScoredIdea[]> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .eq("user_id", user.user.id)
    .in("status", ["suggested", "approved", "scheduled"])
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd)
    .order("total_score", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Ideas sin fecha asignada (sugeridas disponibles)
export async function fetchUnassignedIdeas(): Promise<ScoredIdea[]> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("status", "suggested")
    .is("scheduled_date", null)
    .order("total_score", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// Posts del mes
export async function fetchMonthPosts(monthStart: string, monthEnd: string): Promise<DbPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, caption, post_type, status, scheduled_date, platform, created_at, user_id")
    .in("status", ["scheduled", "published"])
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd)
    .order("scheduled_date", { ascending: true });

  if (error) throw error;
  return (data || []) as DbPost[];
}

// Noticia hot para sugerencia YouTube
export async function fetchTopNews(): Promise<DailyNews | null> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data } = await supabase
    .from("daily_news")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("urgency", "hot")
    .order("news_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as DailyNews | null;
}

// Noticias del día (con fallback a las 3 más recientes)
export async function fetchDayNews(date: string): Promise<DailyNews[]> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data: dayData } = await supabase
    .from("daily_news")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("news_date", date)
    .order("created_at", { ascending: true });

  if (dayData && dayData.length > 0) return dayData as DailyNews[];

  // Fallback: 3 most recent
  const { data: recent } = await supabase
    .from("daily_news")
    .select("*")
    .eq("user_id", user.user.id)
    .order("news_date", { ascending: false })
    .limit(3);

  return (recent || []) as DailyNews[];
}

// Aprobar idea
export async function approveIdea(ideaId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("scored_content_ideas")
    .update({ status: "approved" })
    .eq("id", ideaId);
}

// Asignar idea a un día
export async function assignIdeaToDay(ideaId: string, date: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("scored_content_ideas")
    .update({ scheduled_date: date, status: "approved" })
    .eq("id", ideaId);
}
