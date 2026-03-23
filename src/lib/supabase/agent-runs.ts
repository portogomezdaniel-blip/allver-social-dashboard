import { createClient } from "./client";

export interface AgentRun {
  id: string;
  user_id: string;
  agent_name: string;
  input_summary: string | null;
  output_data: unknown;
  tokens_used: number | null;
  duration_ms: number | null;
  status: string;
  created_at: string;
}

export async function fetchAgentRuns(
  limit: number = 10
): Promise<AgentRun[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
