import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, ideaId, hook, format } = await req.json();
    if (!userId || !ideaId || !hook) return NextResponse.json({ error: "userId, ideaId, and hook required" }, { status: 400 });

    const identity = await getIdentity(userId);
    const knowledgeCtx = await getKnowledgeContext(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    const formatGuide = format === "reel" ? "Texto corto y punchy. Maximo 3 parrafos."
      : format === "carousel" ? "Mas educativo y estructurado. Desarrolla cada punto."
      : format === "story" ? "Conversacional y directo. Como hablarle a un amigo."
      : "Una frase poderosa y memorable. Maximo 2 oraciones.";

    const systemPrompt = `Eres el copywriter principal de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${knowledgeCtx}${tempCtx}\n\nGenera un CAPTION COMPLETO para Instagram/TikTok. Debe:\n1. Abrir con el hook dado\n2. Desarrollar la idea en 3-5 parrafos\n3. Usar la voz y vocabulario del creador\n4. Incluir CTA natural al final\n5. Agregar 5-8 hashtags relevantes\n6. ${formatGuide}`;

    const userPrompt = `Hook: "${hook}"\nFormato: ${format || "reel"}\n\nGenera el caption completo. Responde SOLO el texto, sin JSON, sin markdown.`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userPrompt, 1500);

    const copy = text.trim();

    // Save to idea outline
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: ideaData } = await supabase.from("scored_content_ideas").select("outline").eq("id", ideaId).maybeSingle();
    const currentOutline = (ideaData?.outline as Record<string, unknown>) || {};
    await supabase.from("scored_content_ideas").update({ outline: { ...currentOutline, generated_copy: copy } }).eq("id", ideaId);

    await logAgentRun({ userId, agentName: "generate-copy", inputSummary: `Copy para: "${hook.slice(0, 50)}"`, outputData: { length: copy.length }, tokensUsed, durationMs });

    return NextResponse.json({ copy });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
