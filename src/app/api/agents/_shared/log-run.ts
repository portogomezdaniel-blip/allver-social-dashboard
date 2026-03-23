import { createClient } from "@supabase/supabase-js";

export async function logAgentRun(params: {
  userId: string;
  agentName: string;
  inputSummary: string;
  outputData: unknown;
  tokensUsed: number;
  durationMs: number;
  status?: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("agent_runs").insert({
    user_id: params.userId,
    agent_name: params.agentName,
    input_summary: params.inputSummary,
    output_data: params.outputData,
    tokens_used: params.tokensUsed,
    duration_ms: params.durationMs,
    status: params.status ?? "completed",
  });
}
