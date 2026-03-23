import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const identity = await getIdentity(userId);
    if (!identity) return NextResponse.json({ error: "No identity found" }, { status: 404 });

    const { data: knowledge } = await supabase.from("creator_knowledge").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false });

    const fragments = knowledge ?? [];
    if (fragments.length === 0) return NextResponse.json({ message: "No knowledge to evolve from" });

    const byCategory: Record<string, string[]> = {};
    for (const f of fragments) {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f.content);
    }

    const knowledgeBlock = Object.entries(byCategory)
      .map(([cat, items]) => `${cat.toUpperCase()} (${items.length}):\n${items.map((i) => `- ${i}`).join("\n")}`)
      .join("\n\n");

    const { text, tokensUsed, durationMs } = await callClaude(
      "Eres el arquitecto de identidad de un creador de contenido. Reescribes system prompts basandote en conocimiento real acumulado.",
      `PERFIL ACTUAL (compiled_prompt):\n${identity.compiled_prompt || "Sin prompt previo"}\n\nCONOCIMIENTO ACUMULADO:\n${knowledgeBlock}\n\nReescribe el compiled_prompt integrando TODO este conocimiento. El prompt debe tener 400-600 palabras. Incluye: quien es, como habla (con vocabulario real), que cree, a quien le habla, historias que puede referenciar, metas de contenido.\n\nResponde SOLO con el texto del prompt, sin JSON, sin markdown, sin comillas.`,
      3000
    );

    const newPrompt = text.trim();

    await supabase.from("creator_identity").update({
      compiled_prompt: newPrompt,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await logAgentRun({ userId, agentName: "evolve-identity", inputSummary: `Identidad evolucionada con ${fragments.length} fragmentos`, outputData: { fragmentsUsed: fragments.length, promptLength: newPrompt.length }, tokensUsed, durationMs });

    return NextResponse.json({ newPrompt, fragmentsUsed: fragments.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
