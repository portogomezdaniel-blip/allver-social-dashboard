import { createClient } from "./client";

export interface IdeaSession {
  id: string;
  user_id: string;
  input_text: string;
  generated_hooks: { text: string; category: string }[];
  generated_ideas: { title: string; format: string; description: string; angle: string }[];
  hooks_saved: number;
  posts_created: number;
  is_favorite: boolean;
  created_at: string;
}

export async function fetchSessions(limit: number = 20): Promise<IdeaSession[]> {
  const supabase = createClient();
  const { data } = await supabase.from("idea_sessions").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function createSession(session: { input_text: string; generated_hooks: unknown; generated_ideas: unknown }): Promise<IdeaSession> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("idea_sessions").insert({ ...session, user_id: user!.id }).select().single();
  if (error) throw error;
  return data;
}

export async function toggleSessionFavorite(id: string, isFavorite: boolean): Promise<void> {
  const supabase = createClient();
  await supabase.from("idea_sessions").update({ is_favorite: isFavorite }).eq("id", id);
}
