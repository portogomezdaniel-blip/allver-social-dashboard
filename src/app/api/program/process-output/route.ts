import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../../agents/_shared/call-claude";
import { getIdentity } from "../../agents/_shared/get-identity";
import { logAgentRun } from "../../agents/_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, outputId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: output } = await supabase
      .from("weekly_program_output")
      .select("*")
      .eq("id", outputId)
      .single();

    if (!output) return NextResponse.json({ error: "Output not found" }, { status: 404 });

    const identity = await getIdentity(userId);

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("caption, post_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const start = Date.now();

    const result = await callClaude(
      `Eres el director creativo de un creador de contenido. Generas ideas rankeadas por potencial.

${identity?.compiled_prompt || ""}

FRAMEWORK DE CONTENIDO:
- REELS = Filtro de identidad (opiniones fuertes, hot takes, personalidad)
- CARRUSELES = Autoridad (guias tecnicas, educacion, datos)
- STORIES = Call to Action (behind scenes, testimonios, CTAs)
- SINGLES = Refuerzo de marca (frases, reflexiones)`,

      `El creador completo un modulo de su programa de autodescubrimiento.
Modulo: ${output.week_number || "?"} - Fase: ${output.phase || "general"}

DATOS DEL MODULO:
Temas: ${(output.key_themes || []).join(", ")}
Insights: ${(output.key_insights || []).join(". ")}
Estado emocional: ${output.emotional_state || "neutral"}
Temperatura: ${output.temperature_score || 5}/10
Creencias: ${(output.new_beliefs || []).join(". ")}
Historias: ${(output.new_stories || []).join(". ")}

OUTPUT:
"${(output.raw_output || "").slice(0, 2000)}"

NO repetir estos posts recientes:
${(recentPosts || []).map((p) => `- ${p.post_type}: ${p.caption?.slice(0, 50)}`).join("\n")}

Genera 15 ideas de contenido para la semana. Cada idea con scores del 1 al 10.

REGLAS DE TEMPERATURA:
- Temperatura 8-10: priorizar REELS polarizantes, hot takes, opiniones fuertes
- Temperatura 5-7: priorizar CARRUSELES educativos, contenido consistente
- Temperatura 1-4: priorizar SINGLES reflexivos, contenido pensativo

BALANCE: minimo 4 reels, 3 carruseles, 3 stories, 2 singles.

TOTAL SCORE = (relevance x 0.35) + (virality x 0.25) + (authority x 0.20) + (conversion x 0.20)

Responde SOLO en JSON sin markdown:
{
  "ideas": [
    {
      "title": "...",
      "hook": "primera linea publicable",
      "format": "reel|carousel|single|story",
      "funnel_role": "filter|authority|conversion|brand",
      "description": "que publicar en 2-3 lineas",
      "outline": ["punto 1", "punto 2"],
      "suggested_day": "lunes|martes|...",
      "relevance_score": 8.5,
      "virality_score": 7.0,
      "authority_score": 6.5,
      "conversion_score": 5.0,
      "total_score": 7.1,
      "score_reasoning": "en 1 linea"
    }
  ],
  "weekly_theme": "tema de la semana",
  "temperature_reading": "interpretacion del estado del creador"
}`,
      4000
    );

    let ideasData;
    try {
      const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = clean.match(/\{[\s\S]*"ideas"[\s\S]*\}/);
      ideasData = JSON.parse(match ? match[0] : clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse", raw: result.text }, { status: 500 });
    }

    const ideasToInsert = (ideasData.ideas || []).map((idea: Record<string, unknown>) => ({
      user_id: userId,
      source_output_id: outputId,
      title: idea.title,
      hook: idea.hook,
      format: idea.format,
      funnel_role: idea.funnel_role,
      description: idea.description,
      outline: idea.outline ? { points: idea.outline } : null,
      suggested_day: idea.suggested_day,
      temperature_score: output.temperature_score || 5,
      relevance_score: (idea.relevance_score as number) || 5,
      virality_score: (idea.virality_score as number) || 5,
      authority_score: (idea.authority_score as number) || 5,
      conversion_score: (idea.conversion_score as number) || 5,
      total_score: (idea.total_score as number) || 5,
      score_reasoning: idea.score_reasoning || "",
      status: "suggested",
    }));

    await supabase.from("scored_content_ideas").insert(ideasToInsert);

    await supabase
      .from("weekly_program_output")
      .update({
        processed: true,
        ideas_generated: ideasToInsert.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outputId);

    await logAgentRun({
      userId,
      agentName: "process-ftpaa-output",
      inputSummary: `Module ${output.week_number}, phase: ${output.phase}, temp: ${output.temperature_score}`,
      outputData: { count: ideasToInsert.length, theme: ideasData.weekly_theme },
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      ideasGenerated: ideasToInsert.length,
      weeklyTheme: ideasData.weekly_theme,
      temperatureReading: ideasData.temperature_reading,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
