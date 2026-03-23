import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, competitorId } = await req.json();

    if (!userId || !competitorId) {
      return NextResponse.json(
        { error: "userId and competitorId required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get competitor info
    const { data: competitor } = await supabase
      .from("competitors")
      .select("*")
      .eq("id", competitorId)
      .single();

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    // Get competitor posts
    const { data: posts } = await supabase
      .from("competitor_posts")
      .select("*")
      .eq("competitor_id", competitorId)
      .order("posted_at", { ascending: false })
      .limit(20);

    const identity = await getIdentity(userId);
    const niche = identity?.niche || "fitness";

    const systemPrompt = `Eres un analista de contenido de Instagram especializado en ${niche}. Analiza los datos de este competidor y da insights accionables.`;

    const postsList =
      posts && posts.length > 0
        ? posts
            .map(
              (p, i) =>
                `${i + 1}. [${p.post_type || "Post"}] ${p.caption?.slice(0, 150) || "Sin caption"} — ${p.likes_count || 0} likes, ${p.comments_count || 0} comments${p.views_count ? `, ${p.views_count} views` : ""} — ${p.posted_at || "fecha desconocida"}`
            )
            .join("\n")
        : "No hay posts scrapeados aun para este competidor.";

    const userMessage = `Competidor: ${competitor.handle} (${competitor.name})
Plataforma: ${competitor.platform}
Seguidores: ${competitor.followers}
Engagement promedio: ${competitor.avg_engagement}%
Posts por semana: ${competitor.posts_per_week}

Ultimos posts:
${postsList}

Analiza e identifica:
1. Frecuencia de publicacion (dias y horas)
2. Formatos que mejor le funcionan (por engagement)
3. Temas recurrentes
4. Patrones en hooks (primera frase de cada post)
5. Que tipo de CTAs usa
6. Gaps: que NO esta cubriendo que nosotros podriamos cubrir

Responde SOLO en JSON valido, sin markdown:
{
  "frequency": {"posts_per_week": 0, "best_days": [], "best_times": []},
  "top_formats": [{"format": "", "avg_engagement": 0}],
  "recurring_topics": [""],
  "hook_patterns": [""],
  "cta_patterns": [""],
  "gaps": [""],
  "summary": ""
}`;

    const { text, tokensUsed, durationMs } = await callClaude(
      systemPrompt,
      userMessage,
      2500
    );

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { summary: text, gaps: [] };
    }

    await logAgentRun({
      userId,
      agentName: "analyze-competitor",
      inputSummary: `Analisis de ${competitor.handle}`,
      outputData: parsed,
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({ analysis: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
