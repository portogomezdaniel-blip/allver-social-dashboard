import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const identity = await getIdentity(userId);
    if (!identity) return NextResponse.json({ error: "No identity found" }, { status: 404 });

    const start = Date.now();

    const result = await callClaude(
      `Eres un curador de noticias para un ${identity.niche || "fitness"} en ${identity.city || "LATAM"}. ${identity.compiledPrompt || ""}`,
      `Busca 3 noticias REALES de hoy o esta semana relevantes para un creador de contenido de ${identity.niche || "fitness"}.

REGLAS:
- Solo noticias REALES y recientes. No inventes.
- Cada noticia debe ser relevante para el nicho del creador.
- Genera un hook en la voz del creador para cada una.

Las 3 noticias deben ser:

1. HOT — Algo urgente que debe publicar HOY. Una noticia que si no la comenta hoy, pierde relevancia.
2. WARM — Algo relevante para publicar esta semana. Un estudio, tendencia, o evento del nicho.
3. EVERGREEN — Algo atemporal que puede publicar cuando quiera. Un insight, dato, o reflexion del sector.

Responde SOLO en JSON sin markdown:
{
  "news": [
    {
      "title": "Titulo de la noticia",
      "source": "Nombre del medio",
      "source_url": "URL real si la conoces, sino dejar vacio",
      "summary": "Resumen en 2 oraciones maximo",
      "urgency": "hot",
      "suggested_hook": "Hook en la voz del creador, publicable como primera linea de un post",
      "suggested_format": "reel|carousel|single"
    },
    {
      "title": "...",
      "source": "...",
      "source_url": "",
      "summary": "...",
      "urgency": "warm",
      "suggested_hook": "...",
      "suggested_format": "..."
    },
    {
      "title": "...",
      "source": "...",
      "source_url": "",
      "summary": "...",
      "urgency": "evergreen",
      "suggested_hook": "...",
      "suggested_format": "..."
    }
  ]
}`,
      2000
    );

    let newsData;
    try {
      const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = clean.match(/\{[\s\S]*"news"[\s\S]*\}/);
      newsData = JSON.parse(match ? match[0] : clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse news", raw: result.text }, { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];

    for (const item of newsData.news || []) {
      await supabase.from("daily_news").upsert(
        {
          user_id: userId,
          news_date: today,
          title: item.title,
          source: item.source || "",
          source_url: item.source_url || "",
          summary: item.summary || "",
          relevance: "",
          suggested_hook: item.suggested_hook || "",
          suggested_format: item.suggested_format || "single",
          urgency: item.urgency || "warm",
        },
        { onConflict: "user_id,news_date,title" }
      );
    }

    await logAgentRun({
      userId,
      agentName: "daily-news",
      inputSummary: `3 noticias para ${identity.niche}`,
      outputData: newsData,
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({ success: true, news: newsData.news });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
