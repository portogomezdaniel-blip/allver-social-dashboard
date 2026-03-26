import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, entryId, question_1, question_2, question_3, answer_1, answer_2, answer_3 } = await req.json();
    if (!userId || !answer_1) return NextResponse.json({ error: "userId and answers required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const identity = await getIdentity(userId);
    const knowledgeCtx = await getKnowledgeContext(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    // Cross-context: program phase
    const { data: lastProgram } = await supabase
      .from("weekly_program_output")
      .select("phase, key_themes, temperature_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const programCtx = lastProgram
      ? `\nFASE DEL PROGRAMA: ${lastProgram.phase}. Temas: ${(lastProgram.key_themes || []).join(", ")}. Conecta el briefing con estos temas cuando sea natural.`
      : "";

    const { text, tokensUsed, durationMs } = await callClaude(
      `Eres el director creativo personal de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico."}${knowledgeCtx}${tempCtx}${programCtx}`,
      `Hoy el creador respondio estas preguntas en su diario:

PREGUNTA 1: "${question_1}"
RESPUESTA: "${answer_1}"

PREGUNTA 2: "${question_2}"
RESPUESTA: "${answer_2 || "Sin respuesta"}"

PREGUNTA 3: "${question_3}"
RESPUESTA: "${answer_3 || "Sin respuesta"}"

Genera un BRIEFING COMPLETO DE CONTENIDO. Responde SOLO en JSON valido:
{
  "mood": "reflective|fired_up|frustrated|grateful|philosophical|determined|vulnerable",
  "themes": ["tema1", "tema2"],
  "quote_of_the_day": "Frase poderosa publicable en Instagram",
  "content_plan": {
    "hero_post": {
      "title": "Post principal del dia",
      "format": "reel|carousel|single",
      "hook": "Primera linea lista para copiar",
      "outline": ["Punto 1", "Punto 2", "Punto 3"],
      "cta": "Call to action",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "best_time": "18:30",
      "why": "Por que este post va a funcionar",
      "source_question": 1
    },
    "secondary_posts": [
      {"title": "...", "format": "reel|carousel|single|story", "hook": "...", "brief": "...", "angle": "educational|social_proof|controversial|personal|practical", "source_question": 2},
      {"title": "...", "format": "...", "hook": "...", "brief": "...", "angle": "...", "source_question": 3}
    ]
  },
  "hooks_bank": [
    {"text": "...", "category": "controversy|question|data|story|challenge", "power_score": 9}
  ],
  "story_ideas": [
    {"type": "poll|question|this_or_that|behind_scenes|hot_take", "content": "...", "engagement_tactic": "..."}
  ],
  "carousel_structure": {
    "title": "Titulo del carrusel",
    "slides": [
      {"slide": 1, "type": "hook", "content": "..."},
      {"slide": 2, "type": "problem", "content": "..."},
      {"slide": 3, "type": "insight", "content": "..."},
      {"slide": 4, "type": "solution", "content": "..."},
      {"slide": 5, "type": "proof", "content": "..."},
      {"slide": 6, "type": "cta", "content": "..."}
    ]
  },
  "weekly_strategy": {
    "theme_of_week": "Tema paraguas de la semana",
    "monday": {"format": "reel", "topic": "..."},
    "tuesday": {"format": "carousel", "topic": "..."},
    "wednesday": {"format": "story_series", "topic": "..."},
    "thursday": {"format": "single", "topic": "..."},
    "friday": {"format": "reel", "topic": "..."}
  },
  "repurpose_ideas": [
    {"from": "...", "to": "Thread de Twitter", "how": "..."},
    {"from": "...", "to": "YouTube Shorts", "how": "..."},
    {"from": "...", "to": "Imagen quote para story", "how": "..."}
  ],
  "audience_engagement": {
    "question_to_ask": "...",
    "poll_idea": {"question": "...", "option_a": "...", "option_b": "..."},
    "comment_prompt": "..."
  },
  "personal_brand_note": "Observacion sobre su marca personal basada en lo que escribio"
}`,
      4000
    );

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { mood: "reflective", themes: [], quote_of_the_day: text.slice(0, 200), hooks_bank: [], content_plan: { hero_post: null, secondary_posts: [] }, story_ideas: [], carousel_structure: null, weekly_strategy: null, repurpose_ideas: [], audience_engagement: null }; }

    // Backward compat: keep hooks/ideas for old UI
    const backcompat = {
      ...parsed,
      hooks: (parsed.hooks_bank || []).map((h: { text: string; category: string; power_score: number }) => ({ text: h.text, source_question: 1, category: h.category })),
      ideas: [
        ...(parsed.content_plan?.hero_post ? [{ title: parsed.content_plan.hero_post.title, format: parsed.content_plan.hero_post.format, description: parsed.content_plan.hero_post.why, source_question: parsed.content_plan.hero_post.source_question }] : []),
        ...(parsed.content_plan?.secondary_posts || []).map((p: { title: string; format: string; brief: string; source_question: number }) => ({ title: p.title, format: p.format, description: p.brief, source_question: p.source_question })),
      ],
    };

    await supabase.from("journal_entries").update({
      answer_1, answer_2, answer_3,
      status: "completed",
      generated_content: backcompat,
      full_briefing: parsed,
      mood: parsed.mood,
      themes: parsed.themes || [],
    }).eq("id", entryId);

    // Insert ideas into unified scored_content_ideas
    const ideasToScore: Record<string, unknown>[] = [];
    if (parsed.content_plan?.hero_post?.hook) {
      ideasToScore.push({
        user_id: userId, source: "journal", source_id: entryId,
        title: parsed.content_plan.hero_post.title || "Hero post",
        hook: parsed.content_plan.hero_post.hook,
        format: parsed.content_plan.hero_post.format || "reel",
        funnel_role: "filter",
        description: parsed.content_plan.hero_post.why || "",
        outline: parsed.content_plan.hero_post.outline ? { points: parsed.content_plan.hero_post.outline } : null,
        suggested_day: new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
        temperature_score: temperature, relevance_score: 9, virality_score: 7, authority_score: 6, conversion_score: 5,
        total_score: 7.2, score_reasoning: "Hero post del journal", status: "suggested",
      });
    }
    for (const p of parsed.content_plan?.secondary_posts || []) {
      if (p.hook) ideasToScore.push({
        user_id: userId, source: "journal", source_id: entryId,
        title: p.title || "", hook: p.hook, format: p.format || "single", funnel_role: p.angle === "educational" ? "authority" : "filter",
        description: p.brief || "", temperature_score: temperature,
        relevance_score: 8, virality_score: 6, authority_score: 6, conversion_score: 5,
        total_score: 6.5, score_reasoning: "Idea secundaria del journal", status: "suggested",
      });
    }
    for (const h of parsed.hooks_bank || []) {
      if (h.text) {
        await supabase.from("hooks").insert({ user_id: userId, text: h.text, source: "journal", category: h.category || "data" }).select();
        ideasToScore.push({
          user_id: userId, source: "journal", source_id: entryId,
          title: `Hook: ${h.text.slice(0, 50)}`, hook: h.text, format: "reel", funnel_role: "filter",
          description: "Hook del journal", temperature_score: temperature,
          relevance_score: 8, virality_score: h.power_score || 7, authority_score: 5, conversion_score: 4,
          total_score: Number(((8 * 0.35 + (h.power_score || 7) * 0.25 + 5 * 0.2 + 4 * 0.2)).toFixed(1)),
          score_reasoning: `Hook journal power:${h.power_score || "?"}`, status: "suggested",
        });
      }
    }
    if (ideasToScore.length) await supabase.from("scored_content_ideas").insert(ideasToScore);

    // Recalculate temperature
    const { recalculateTemperature } = await import("@/lib/temperature");
    await recalculateTemperature(userId);

    await logAgentRun({ userId, agentName: "journal-analyze", inputSummary: `Briefing: mood ${parsed.mood}, hero post + ${(parsed.hooks_bank || []).length} hooks + ${ideasToScore.length} scored ideas`, outputData: { mood: parsed.mood, hooksCount: (parsed.hooks_bank || []).length, scoredIdeas: ideasToScore.length }, tokensUsed, durationMs });

    return NextResponse.json({ content: backcompat, briefing: parsed });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
