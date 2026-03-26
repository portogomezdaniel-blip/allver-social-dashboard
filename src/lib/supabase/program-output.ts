import { createClient } from "./client";

export interface ProgramOutput {
  id: string;
  user_id: string;
  week_number: number | null;
  phase: string | null;
  raw_output: string;
  key_themes: string[];
  key_insights: string[];
  emotional_state: string;
  new_beliefs: string[];
  new_stories: string[];
  new_vocabulary: string[];
  temperature_score: number;
  processed: boolean;
  ideas_generated: number;
  created_at: string;
}

export interface ScoredIdea {
  id: string;
  user_id: string;
  source_output_id: string;
  title: string;
  hook: string;
  format: string;
  funnel_role: string;
  description: string;
  outline: unknown;
  suggested_day: string;
  temperature_score: number;
  relevance_score: number;
  virality_score: number;
  authority_score: number;
  conversion_score: number;
  total_score: number;
  score_reasoning: string;
  status: string;
  scheduled_date: string | null;
  created_at: string;
}

export async function fetchLatestOutput(): Promise<ProgramOutput | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("weekly_program_output")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchScoredIdeas(options?: {
  minScore?: number;
  format?: string;
  funnelRole?: string;
  status?: string;
  limit?: number;
}): Promise<ScoredIdea[]> {
  const supabase = createClient();
  let query = supabase
    .from("scored_content_ideas")
    .select("*")
    .order("total_score", { ascending: false });

  if (options?.minScore) query = query.gte("total_score", options.minScore);
  if (options?.format) query = query.eq("format", options.format);
  if (options?.funnelRole) query = query.eq("funnel_role", options.funnelRole);
  if (options?.status) query = query.eq("status", options.status);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data ?? [];
}

export async function updateIdeaStatus(
  ideaId: string,
  status: string,
  scheduledDate?: string
) {
  const supabase = createClient();
  const update: Record<string, unknown> = { status };
  if (scheduledDate) update.scheduled_date = scheduledDate;
  const { error } = await supabase
    .from("scored_content_ideas")
    .update(update)
    .eq("id", ideaId);
  return !error;
}

export async function getCreatorTemperature(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("weekly_program_output")
    .select("temperature_score")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.temperature_score || 5;
}

export async function getProgramProgress(): Promise<{
  totalOutputs: number;
  phases: string[];
  currentPhase: string | null;
  avgTemperature: number;
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from("weekly_program_output")
    .select("phase, temperature_score")
    .order("created_at", { ascending: false });

  if (!data?.length)
    return { totalOutputs: 0, phases: [], currentPhase: null, avgTemperature: 5 };

  const phases = [...new Set(data.map((d) => d.phase).filter(Boolean))] as string[];
  const avgTemp =
    data.reduce((sum, d) => sum + (d.temperature_score || 5), 0) / data.length;

  return {
    totalOutputs: data.length,
    phases,
    currentPhase: data[0].phase || null,
    avgTemperature: Math.round(avgTemp * 10) / 10,
  };
}
