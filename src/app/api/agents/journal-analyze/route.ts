import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, entryId, question_1, question_2, question_3, answer_1, answer_2, answer_3 } = await req.json();
    if (!userId || !answer_1) return NextResponse.json({ error: "userId and answers required" }, { status: 400 });

    const identity = await getIdentity(userId);

    const { text, tokensUsed, durationMs } = await callClaude(
      `Eres el estratega creativo de un creador de contenido fitness.\n\n${identity?.compiled_prompt || ""}`,
      `Hoy el creador respondio estas preguntas en su diario:\n\nPregunta 1: "${question_1}"\nRespuesta: "${answer_1}"\n\nPregunta 2: "${question_2}"\nRespuesta: "${answer_2 || "Sin respuesta"}"\n\nPregunta 3: "${question_3}"\nRespuesta: "${answer_3 || "Sin respuesta"}"\n\nGenera:\n1. MOOD (reflective, fired_up, frustrated, grateful, philosophical)\n2. TEMAS que emergieron\n3. TRES HOOKS que nacen de estas reflexiones\n4. TRES IDEAS DE CONTENIDO\n5. UNA FRASE DEL DIA\n\nResponde SOLO en JSON:\n{\n  "mood": "fired_up",\n  "themes": ["discipline"],\n  "hooks": [{"text": "...", "source_question": 1, "category": "..."}],\n  "ideas": [{"title": "...", "format": "reel", "description": "...", "source_question": 1}],\n  "quote_of_the_day": "..."\n}`,
      2500
    );

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { mood: "reflective", themes: [], hooks: [], ideas: [], quote_of_the_day: "" }; }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    await supabase.from("journal_entries").update({
      answer_1, answer_2, answer_3,
      status: "completed",
      generated_content: parsed,
      mood: parsed.mood,
      themes: parsed.themes || [],
    }).eq("id", entryId);

    await logAgentRun({ userId, agentName: "journal-analyze", inputSummary: `Diario: mood ${parsed.mood}, ${(parsed.themes || []).length} temas`, outputData: parsed, tokensUsed, durationMs });

    return NextResponse.json({ content: parsed });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
