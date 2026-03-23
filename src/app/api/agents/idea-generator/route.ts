import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext } from "../_shared/get-identity";
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

    const { text, tokensUsed, durationMs } = await callClaude(
      `Eres el estratega creativo de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${knowledgeCtx}`,
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

    await logAgentRun({ userId, agentName: "idea-generator", inputSummary: `Idea: "${input.slice(0, 50)}..."`, outputData: { hooks: (parsed.hooks || []).length, ideas: (parsed.ideas || []).length }, tokensUsed, durationMs });

    return NextResponse.json({ session, hooks: parsed.hooks || [], ideas: parsed.ideas || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
