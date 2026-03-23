import { createClient } from "./client";

export interface Hook {
  id: string;
  user_id: string;
  text: string;
  source: string;
  source_post_id: string | null;
  category: string | null;
  engagement_score: number | null;
  times_used: number;
  is_favorite: boolean;
  created_at: string;
}

export async function fetchHooks(): Promise<Hook[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hooks")
    .select("*")
    .order("engagement_score", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createHook(hook: {
  text: string;
  source: string;
  category?: string;
  engagement_score?: number;
  source_post_id?: string;
}): Promise<Hook> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("hooks")
    .insert({ ...hook, user_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleFavorite(
  id: string,
  isFavorite: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("hooks")
    .update({ is_favorite: isFavorite })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteHook(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("hooks").delete().eq("id", id);
  if (error) throw error;
}
