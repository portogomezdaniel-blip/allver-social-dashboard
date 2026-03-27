import { createClient } from "./client";
import type { ScoredIdea } from "./program-output";

// Ideas del mes CON fecha + ideas SIN fecha (bandeja)
export async function fetchCalendarIdeas(monthStart: string, monthEnd: string): Promise<{
  assigned: ScoredIdea[];
  unassigned: ScoredIdea[];
}> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { assigned: [], unassigned: [] };

  const { data: assigned } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .eq("user_id", user.user.id)
    .in("status", ["suggested", "approved", "scheduled"])
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd)
    .order("total_score", { ascending: false });

  const { data: unassigned } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .eq("user_id", user.user.id)
    .in("status", ["suggested", "approved"])
    .is("scheduled_date", null)
    .order("total_score", { ascending: false })
    .limit(20);

  return { assigned: assigned || [], unassigned: unassigned || [] };
}

// Asignar idea a un día
export async function assignIdeaToDay(ideaId: string, date: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("scored_content_ideas").update({ scheduled_date: date, status: "approved" }).eq("id", ideaId);
}

// Mover idea a otro día
export async function moveIdeaToDay(ideaId: string, newDate: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("scored_content_ideas").update({ scheduled_date: newDate }).eq("id", ideaId);
}

// Quitar idea del calendario (devolver a bandeja)
export async function unassignIdea(ideaId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("scored_content_ideas").update({ scheduled_date: null, status: "suggested" }).eq("id", ideaId);
}

// Marcar idea como hecha
export async function markIdeaDone(ideaId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("scored_content_ideas").update({ status: "scheduled" }).eq("id", ideaId);
}

// Noticia hot de la semana
export async function fetchTopNews() {
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
  return data;
}
