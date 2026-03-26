import { createClient } from "@supabase/supabase-js";

export async function recalculateTemperature(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Base temperature from program
  const { data: programTemp } = await supabase
    .from("weekly_program_output")
    .select("temperature_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseTemp = programTemp?.temperature_score || 5;

  // 2. Journal activity this week
  const { data: journals } = await supabase
    .from("journal_entries")
    .select("answer_1, answer_2, answer_3, status, mood")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  let journalSignal = 0;
  if (journals?.length) {
    journalSignal += Math.min(journals.length * 0.5, 2);
    for (const j of journals) {
      const len = (j.answer_1?.length || 0) + (j.answer_2?.length || 0) + (j.answer_3?.length || 0);
      if (len > 500) journalSignal += 0.5;
      if (len > 1000) journalSignal += 0.5;
    }
    const lastMood = journals[0]?.mood;
    if (["fired_up", "determined"].includes(lastMood)) journalSignal += 1;
    if (["frustrated", "vulnerable"].includes(lastMood)) journalSignal -= 0.5;
  }

  // 3. Ideas activity
  const { data: ideas } = await supabase
    .from("idea_sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  const ideasSignal = ideas?.length ? Math.min(ideas.length * 0.3, 1.5) : -0.5;

  // 4. Posts created this week
  const { data: posts } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  const postsSignal = posts?.length ? Math.min(posts.length * 0.2, 1) : -0.5;

  // 5. Calculate and clamp
  const raw = baseTemp + journalSignal + ideasSignal + postsSignal;
  return Math.max(1, Math.min(10, Math.round(raw * 10) / 10));
}
