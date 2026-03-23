import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, journalEntryId } = await req.json();
    if (!userId || !journalEntryId) return NextResponse.json({ error: "userId and journalEntryId required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const identity = await getIdentity(userId);

    const { data: entry } = await supabase.from("journal_entries").select("*").eq("id", journalEntryId).single();
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const { data: existing } = await supabase.from("creator_knowledge").select("category, content").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false }).limit(20);

    const existingContext = (existing ?? []).map((f) => `[${f.category}] ${f.content.slice(0, 80)}`).join("\n") || "Sin conocimiento previo";

    const { text, tokensUsed, durationMs } = await callClaude(
      "Eres un analista de identidad para creadores de contenido. Extraes fragmentos atomicos de conocimiento de reflexiones personales.",
      `${identity?.compiled_prompt ? `Perfil actual:\n${identity.compiled_prompt}\n\n` : ""}Conocimiento previo (NO duplicar):\n${existingContext}\n\nNUEVA ENTRADA DEL DIARIO:\n\nPregunta 1: "${entry.question_1}"\nRespuesta: "${entry.answer_1 || ""}"\n\nPregunta 2: "${entry.question_2}"\nRespuesta: "${entry.answer_2 || ""}"\n\nPregunta 3: "${entry.question_3}"\nRespuesta: "${entry.answer_3 || ""}"\n\nExtrae TODOS los fragmentos de conocimiento. Categorias: belief, story, frustration, principle, client_pattern, vulnerability, passion, controversy, method, origin, vocabulary, audience_insight.\n\nResponde SOLO en JSON:\n{\n  "fragments": [\n    {"category": "belief", "content": "...", "context": "Pregunta 1", "emotional_weight": "high", "content_potential": "high", "tags": ["..."]}\n  ]\n}`,
      2500
    );

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { fragments: [] }; }

    const fragments = parsed.fragments || [];
    if (fragments.length > 0) {
      const rows = fragments.map((f: Record<string, unknown>) => ({
        user_id: userId,
        source_type: "journal",
        source_id: journalEntryId,
        source_date: entry.entry_date,
        category: f.category as string,
        content: f.content as string,
        context: f.context as string,
        emotional_weight: f.emotional_weight as string,
        content_potential: f.content_potential as string,
        tags: f.tags as string[],
      }));
      await supabase.from("creator_knowledge").insert(rows);
    }

    await logAgentRun({ userId, agentName: "extract-knowledge", inputSummary: `Extraidos ${fragments.length} fragmentos del diario ${entry.entry_date}`, outputData: { count: fragments.length, categories: fragments.map((f: Record<string, string>) => f.category) }, tokensUsed, durationMs });

    return NextResponse.json({ fragments, count: fragments.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
