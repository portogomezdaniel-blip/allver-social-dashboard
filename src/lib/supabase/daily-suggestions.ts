import { createClient } from "./client";

export interface DailySuggestion {
  id: string;
  user_id: string;
  suggestion_date: string;
  tema: string;
  formato: string;
  hook: string;
  puntos_clave: string[];
  hora_optima: string | null;
  hashtags: string[] | null;
  cta_sugerido: string | null;
  razonamiento: string | null;
  status: string;
  generated_copy: string | null;
  created_at: string;
}

export async function fetchTodaySuggestion(): Promise<DailySuggestion | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_suggestions")
    .select("*")
    .eq("suggestion_date", today)
    .single();
  return data;
}

export async function fetchSuggestions(
  limit: number = 7
): Promise<DailySuggestion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_suggestions")
    .select("*")
    .order("suggestion_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function updateSuggestionStatus(
  id: string,
  status: string,
  generatedCopy?: string
): Promise<void> {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (generatedCopy) updates.generated_copy = generatedCopy;
  const { error } = await supabase
    .from("daily_suggestions")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}
