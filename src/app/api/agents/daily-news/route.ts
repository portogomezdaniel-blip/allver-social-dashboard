import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const identity = await getIdentity(userId);
    const niche = identity?.niche || "fitness y entrenamiento de fuerza";
    const city = identity?.city || "Medellin";

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `Eres un analista de tendencias de contenido para creadores de ${niche} en ${city}, LATAM.

Tu tarea: generar 5 ideas de contenido basadas en tendencias actuales, noticias del sector, o temas virales del nicho.

Cada idea debe incluir:
- Un titulo descriptivo de la tendencia/noticia
- La fuente (puede ser general: "Tendencia Instagram", "Investigacion reciente", "Viral en TikTok", etc)
- Un resumen corto de por que es relevante
- Un hook sugerido para hacer un post sobre esto (primera frase del caption)
- Un formato sugerido (reel, carousel, single)

${identity?.compiled_prompt ? `Contexto del creador:\n${identity.compiled_prompt}` : ""}

Responde SOLO en JSON valido, sin markdown:
{
  "news": [
    {
      "title": "",
      "source": "",
      "summary": "",
      "relevance": "",
      "suggested_hook": "",
      "suggested_format": "reel|carousel|single"
    }
  ]
}`;

    const { text, tokensUsed, durationMs } = await callClaude(
      systemPrompt,
      `Genera 5 ideas de contenido para hoy ${today}. Nicho: ${niche}. Ciudad: ${city}.`
    );

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { news: [] };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (parsed.news && parsed.news.length > 0) {
      const rows = parsed.news.map((n: Record<string, string>) => ({
        user_id: userId,
        news_date: today,
        title: n.title,
        source: n.source,
        summary: n.summary,
        relevance: n.relevance,
        suggested_hook: n.suggested_hook,
        suggested_format: n.suggested_format,
      }));

      await supabase.from("daily_news").upsert(rows, {
        onConflict: "user_id,news_date,title",
      });
    }

    await logAgentRun({
      userId,
      agentName: "daily-news",
      inputSummary: `Intel generado para ${today}`,
      outputData: parsed,
      tokensUsed,
      durationMs,
    });

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
