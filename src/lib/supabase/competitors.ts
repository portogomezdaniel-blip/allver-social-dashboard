import { createClient } from "./client";
import type { CompetitorPlatform } from "../mock-competitors";

export interface DbCompetitor {
  id: string;
  user_id: string;
  handle: string;
  name: string;
  platform: CompetitorPlatform;
  followers: number;
  followers_change: number;
  avg_engagement: number;
  posts_per_week: number;
  created_at: string;
}

export async function fetchCompetitors(): Promise<DbCompetitor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createCompetitor(comp: {
  handle: string;
  name: string;
  platform: CompetitorPlatform;
}): Promise<DbCompetitor> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("competitors")
    .insert({
      ...comp,
      user_id: user!.id,
      handle: comp.handle.startsWith("@") ? comp.handle : `@${comp.handle}`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCompetitor(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("competitors").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCompetitor(
  id: string,
  updates: Partial<Pick<DbCompetitor, "followers" | "followers_change" | "avg_engagement" | "posts_per_week">>
): Promise<DbCompetitor> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitors")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
