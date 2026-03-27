import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId;
    // Support both old (hookText) and new (hook + ideaId) interfaces
    const hookText = body.hook || body.hookText;
    const ideaId = body.ideaId;

    if (!userId || !hookText) {
      return NextResponse.json({ error: "userId and hook/hookText required" }, { status: 400 });
    }

    const identity = await getIdentity(userId);
    const knowledgeCtx = await getKnowledgeContext(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    const systemPrompt = `Eres el copywriter de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${knowledgeCtx}${tempCtx}\n\nGenera 5 VARIACIONES del hook dado. Cada variacion debe:\n1. Mantener la misma idea central pero con estructura diferente\n2. Variar entre: pregunta, afirmacion, dato, historia, provocacion\n3. Ser scroll-stoppers — la primera linea debe atrapar\n4. Sonar como el creador, no como IA`;

    const userPrompt = `Hook original: "${hookText}"\n\nGenera 5 variaciones. Responde SOLO en JSON valido, sin markdown:\n{ "hooks": ["variacion 1", "variacion 2", "variacion 3", "variacion 4", "variacion 5"] }`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userPrompt, 1500);

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { hooks: [] }; }

    const hooks: string[] = parsed.hooks || [];

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // If called from idea detail, save to idea outline
    if (ideaId) {
      const { data: ideaData } = await supabase.from("scored_content_ideas").select("outline").eq("id", ideaId).maybeSingle();
      const currentOutline = (ideaData?.outline as Record<string, unknown>) || {};
      await supabase.from("scored_content_ideas").update({ outline: { ...currentOutline, generated_hooks: hooks } }).eq("id", ideaId);
    }

    // Also save as hook bank entries
    if (hooks.length > 0) {
      const hookRows = hooks.map((h: string) => ({ user_id: userId, text: h, source: "ai_generated", category: "variation" }));
      await supabase.from("hooks").insert(hookRows);
    }

    await logAgentRun({ userId, agentName: "generate-hooks", inputSummary: `Hooks para: "${hookText.slice(0, 50)}"`, outputData: { count: hooks.length }, tokensUsed, durationMs });

    // Return both formats for backward compat
    return NextResponse.json({
      hooks,
      variations: hooks.map((h: string) => ({ hook: h, suggested_topic: "", format: "reel" })),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
