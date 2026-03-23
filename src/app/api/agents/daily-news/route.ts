import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAllNews } from "@/lib/news-fetcher";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

const nicheKeywords: Record<string, string[]> = {
  strength_coach: ["powerlifting", "entrenamiento fuerza", "squat", "deadlift", "fitness trends", "Instagram fitness"],
  functional_coach: ["crossfit", "entrenamiento funcional", "HIIT", "movilidad", "fitness trends"],
  wellness_coach: ["yoga", "meditacion", "bienestar", "mindfulness", "wellness trends"],
  nutrition_coach: ["nutricion deportiva", "suplementos", "dieta", "proteina", "food trends"],
  running_coach: ["running", "maraton", "triatlon", "resistencia", "running trends"],
  general_fitness: ["fitness", "gym", "entrenamiento", "salud", "fitness trends"],
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const identity = await getIdentity(userId);
    const niche = identity?.niche || "general_fitness";
    const city = identity?.city || "LATAM";
    const keywords = nicheKeywords[niche] || nicheKeywords.general_fitness;

    const realNews = await fetchAllNews(niche, city, keywords);
    if (realNews.length === 0) return NextResponse.json({ error: "No news found" }, { status: 404 });

    const newsForAnalysis = realNews.map((n, i) => `${i + 1}. "${n.title}" (${n.source})\n${n.summary}\nCategoria: ${n.category}`).join("\n\n");

    const { text, tokensUsed, durationMs } = await callClaude(
      `Eres el estratega de contenido de un ${niche} en ${city}.\n${identity?.compiled_prompt || ""}`,
      `${realNews.length} noticias reales de hoy:\n\n${newsForAnalysis}\n\nPara CADA noticia genera hook, formato, relevancia, angulo unico, urgencia (hot/warm/evergreen).\nTambien genera 2 CONEXIONES entre noticias y 1 THREAD de 5 posts.\n\nJSON:\n{"analyzed_news":[{"original_index":0,"hook":"","format":"reel","relevance":"","unique_angle":"","urgency":"hot","content_idea":""}],"connections":[{"news_indices":[0,1],"combined_idea":"","format":"carousel","hook":""}],"thread_idea":{"title":"","posts":["","","","",""]}}`,
      4000
    );

    let analysisData;
    try {
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = clean.match(/\{[\s\S]*"analyzed_news"[\s\S]*\}/);
      analysisData = JSON.parse(match ? match[0] : clean);
    } catch { analysisData = { analyzed_news: [], connections: [], thread_idea: null }; }

    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < realNews.length; i++) {
      const news = realNews[i];
      const analysis = (analysisData.analyzed_news || [])[i] || {};
      await supabase.from("daily_news").upsert({
        user_id: userId, news_date: today, title: news.title, source: news.source,
        source_url: news.sourceUrl, summary: news.summary,
        relevance: analysis.relevance || "", suggested_hook: analysis.hook || news.title,
        suggested_format: analysis.format || "single", category: news.category,
        unique_angle: analysis.unique_angle || "", urgency: analysis.urgency || "warm",
        content_idea: analysis.content_idea || "", image_url: news.imageUrl || null,
      }, { onConflict: "user_id,news_date,title" });
    }

    if (analysisData.connections || analysisData.thread_idea) {
      await supabase.from("daily_news_meta").upsert({
        user_id: userId, meta_date: today,
        connections: analysisData.connections || [], thread_idea: analysisData.thread_idea || null,
      }, { onConflict: "user_id,meta_date" });
    }

    await logAgentRun({ userId, agentName: "daily-news", inputSummary: `${realNews.length} noticias reales para ${niche}`, outputData: { newsCount: realNews.length, connections: (analysisData.connections || []).length }, tokensUsed, durationMs });

    return NextResponse.json({ success: true, newsCount: realNews.length, connections: (analysisData.connections || []).length, hasThread: !!analysisData.thread_idea });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
