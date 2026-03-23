import { createClient } from "./client";

export interface CreatorIdentity {
  id: string;
  user_id: string;
  onboarding_status: string;
  current_step: number;
  niche: string | null;
  experience_years: number | null;
  city: string | null;
  gym_name: string | null;
  specialties: string[] | null;
  philosophy: Record<string, unknown>;
  voice_profile: Record<string, unknown>;
  audience_profile: Record<string, unknown>;
  content_goals: string[] | null;
  prohibitions: Record<string, unknown>;
  compiled_prompt: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchIdentity(): Promise<CreatorIdentity | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("creator_identity")
    .select("*")
    .single();
  return data;
}

export async function upsertIdentity(
  updates: Partial<Omit<CreatorIdentity, "id" | "created_at">>
): Promise<CreatorIdentity> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("creator_identity")
    .upsert(
      { ...updates, user_id: user!.id, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
