import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, input } = await req.json();
    if (!userId || !input) return NextResponse.json({ error: "userId and input required" }, { status: 400 });

    const identity = await getIdentity(userId);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: recentHooks } = await supabase.from("hooks").select("text").eq("user_id", userId).order("engagement_score", { ascending: false }).limit(5);
    const { data: recentSessions } = await supabase.from("idea_sessions").select("input_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(3);

    const hooksContext = (recentHooks ?? []).map((h) => `- "${h.text}"`).join("\n") || "Sin hooks previos";
    const sessionsContext = (recentSessions ?? []).map((s) => `- "${s.input_text}"`).join("\n") || "Sin sesiones previas";
    const knowledgeCtx = await getKnowledgeContext(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    // Cross-context: journal + program
    const { data: lastJournal } = await supabase.from("journal_entries").select("themes, mood").eq("user_id", userId).eq("status", "completed").order("entry_date", { ascending: false }).limit(1).maybeSingle();
    const { data: lastProgram } = await supabase.from("weekly_program_output").select("phase, key_themes").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const crossCtx = `${lastJournal ? `\nMOOD JOURNAL: ${lastJournal.mood}. TEMAS: ${(lastJournal.themes || []).join(", ")}` : ""}${lastProgram ? `\nFASE PROGRAMA: ${lastProgram.phase}. TEMAS: ${(lastProgram.key_themes || []).join(", ")}` : ""}\nCruza estos contextos con la idea del creador.`;

    const { text, tokensUsed, durationMs } = await callClaude(
      `Eres el estratega creativo de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${knowledgeCtx}${tempCtx}${crossCtx}`,
      `El creador acaba de escribir esto:\n"${input}"\n\nGenera:\n1. CINCO HOOKS — frases de apertura para Instagram, diferentes en estructura\n2. CINCO IDEAS DE CONTENIDO — cada una con formato y descripcion\n\nHooks existentes (NO repetir):\n${hooksContext}\n\nIdeas recientes (NO repetir):\n${sessionsContext}\n\nResponde SOLO en JSON:\n{\n  "hooks": [{"text": "...", "category": "controversy|question|data|story|challenge"}],\n  "ideas": [{"title": "...", "format": "reel|carousel|single|story", "description": "...", "angle": "educational|social_proof|controversial|personal|practical"}]\n}`,
      2000
    );

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { hooks: [], ideas: [] }; }

    // Save session
    const { data: session } = await supabase.from("idea_sessions").insert({
      user_id: userId, input_text: input,
      generated_hooks: parsed.hooks || [],
      generated_ideas: parsed.ideas || [],
    }).select().single();

    // Insert into unified scored_content_ideas
    const scored: Record<string, unknown>[] = [];
    for (const idea of parsed.ideas || []) {
      scored.push({
        user_id: userId, source: "ideas_bar", source_id: session?.id || null,
        title: idea.title, hook: idea.title, format: idea.format || "reel",
        funnel_role: idea.format === "carousel" ? "authority" : "filter",
        description: idea.description || "", temperature_score: temperature,
        relevance_score: 8, virality_score: 6, authority_score: 5, conversion_score: 5,
        total_score: 6.3, score_reasoning: `Idea de input: "${input.slice(0, 40)}..."`, status: "suggested",
      });
    }
    for (const h of parsed.hooks || []) {
      scored.push({
        user_id: userId, source: "ideas_bar", source_id: session?.id || null,
        title: `Hook: ${h.text.slice(0, 50)}`, hook: h.text, format: "reel", funnel_role: "filter",
        description: "Hook de la barra de ideas", temperature_score: temperature,
        relevance_score: 7, virality_score: 6, authority_score: 4, conversion_score: 4,
        total_score: 5.6, score_reasoning: "Hook de la barra de ideas", status: "suggested",
      });
    }
    if (scored.length) await supabase.from("scored_content_ideas").insert(scored);

    const { recalculateTemperature } = await import("@/lib/temperature");
    await recalculateTemperature(userId);

    await logAgentRun({ userId, agentName: "idea-generator", inputSummary: `Idea: "${input.slice(0, 50)}..."`, outputData: { hooks: (parsed.hooks || []).length, ideas: (parsed.ideas || []).length, scored: scored.length }, tokensUsed, durationMs });

    return NextResponse.json({ session, hooks: parsed.hooks || [], ideas: parsed.ideas || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
