import { createClient } from "./client";

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  question_1: string;
  question_2: string;
  question_3: string;
  answer_1: string | null;
  answer_2: string | null;
  answer_3: string | null;
  status: string;
  generated_content: {
    mood?: string;
    themes?: string[];
    hooks?: { text: string; source_question: number; category: string }[];
    ideas?: { title: string; format: string; description: string; source_question: number }[];
    quote_of_the_day?: string;
  } | null;
  mood: string | null;
  themes: string[] | null;
  created_at: string;
}

export async function fetchTodayEntry(): Promise<JournalEntry | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase.from("journal_entries").select("*").eq("entry_date", today).single();
  return data;
}

export async function fetchEntries(limit: number = 10): Promise<JournalEntry[]> {
  const supabase = createClient();
  const { data } = await supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function upsertEntry(entry: Partial<JournalEntry> & { entry_date: string }): Promise<JournalEntry> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("journal_entries").upsert({ ...entry, user_id: user!.id }, { onConflict: "user_id,entry_date" }).select().single();
  if (error) throw error;
  return data;
}
