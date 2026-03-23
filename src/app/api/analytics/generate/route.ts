import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../../agents/_shared/call-claude";
import { getIdentity } from "../../agents/_shared/get-identity";
import { logAgentRun } from "../../agents/_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, type = "weekly" } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const identity = await getIdentity(userId);

    const days = type === "monthly" ? 30 : 7;
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 86400000);
    const prevStart = new Date(periodStart.getTime() - days * 86400000);

    // Current period posts
    const { data: currentPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "published")
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: false });

    // Previous period posts (for trends)
    const { data: prevPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "published")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", periodStart.toISOString());

    const posts = currentPosts ?? [];
    const prev = prevPosts ?? [];

    // Calculate metrics
    const totalLikes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    const totalSaves = posts.reduce((s, p) => s + (p.saves_count || 0), 0);
    const totalReach = posts.reduce((s, p) => s + (p.reach || p.impressions || 0), 0);
    const avgEng = posts.length > 0 ? Math.round((totalLikes + totalComments) / posts.length * 100) / 100 : 0;

    const prevLikes = prev.reduce((s, p) => s + (p.likes_count || 0), 0);
    const prevComments = prev.reduce((s, p) => s + (p.comments_count || 0), 0);
    const prevReach = prev.reduce((s, p) => s + (p.reach || p.impressions || 0), 0);
    const prevAvgEng = prev.length > 0 ? (prevLikes + prevComments) / prev.length : 0;

    const trend = (curr: number, previous: number) =>
      previous > 0 ? Math.round(((curr - previous) / previous) * 10000) / 100 : 0;

    // Format breakdown
    const formatBreakdown: Record<string, { count: number; avg_likes: number; avg_engagement: number }> = {};
    for (const p of posts) {
      const fmt = p.post_type || "single";
      if (!formatBreakdown[fmt]) formatBreakdown[fmt] = { count: 0, avg_likes: 0, avg_engagement: 0 };
      formatBreakdown[fmt].count++;
      formatBreakdown[fmt].avg_likes += p.likes_count || 0;
      formatBreakdown[fmt].avg_engagement += (p.likes_count || 0) + (p.comments_count || 0);
    }
    for (const fmt of Object.keys(formatBreakdown)) {
      const fb = formatBreakdown[fmt];
      fb.avg_likes = Math.round(fb.avg_likes / fb.count);
      fb.avg_engagement = Math.round(fb.avg_engagement / fb.count * 100) / 100;
    }

    // Best post
    const sorted = [...posts].sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)));
    const bestPost = sorted[0];
    const worstPost = sorted[sorted.length - 1];

    // AI analysis
    const formatStr = Object.entries(formatBreakdown)
      .map(([f, d]) => `${f}: ${d.count} posts, avg ${d.avg_likes} likes, avg engagement ${d.avg_engagement}`)
      .join("\n");

    const top3 = sorted.slice(0, 3).map((p, i) => `${i + 1}. [${p.post_type}] "${p.caption?.slice(0, 80)}..." — ${p.likes_count || 0} likes, ${p.comments_count || 0} comments`).join("\n");
    const bottom3 = sorted.slice(-3).map((p, i) => `${i + 1}. [${p.post_type}] "${p.caption?.slice(0, 80)}..." — ${p.likes_count || 0} likes, ${p.comments_count || 0} comments`).join("\n");

    const { text: aiText, tokensUsed, durationMs } = await callClaude(
      "Eres un analista de datos de Instagram especializado en creadores de contenido fitness.",
      `${identity?.compiled_prompt ? `Perfil del creador:\n${identity.compiled_prompt}\n\n` : ""}Datos de performance del ultimo periodo (${type}):

METRICAS GENERALES:
- Posts publicados: ${posts.length}
- Total likes: ${totalLikes} (${trend(totalLikes, prevLikes)}% vs periodo anterior)
- Total comments: ${totalComments} (${trend(totalComments, prevComments)}% vs periodo anterior)
- Engagement rate promedio: ${avgEng} (${trend(avgEng, prevAvgEng)}% vs anterior)
- Alcance total: ${totalReach} (${trend(totalReach, prevReach)}% vs anterior)

BREAKDOWN POR FORMATO:
${formatStr || "Sin datos de formato"}

TOP 3 POSTS:
${top3 || "Sin posts suficientes"}

BOTTOM 3 POSTS:
${bottom3 || "Sin posts suficientes"}

Genera un analisis completo. Responde SOLO en JSON valido sin markdown:
{
  "content_score": 78,
  "summary": "Resumen ejecutivo en 2-3 oraciones.",
  "insights": [
    {"type": "positive", "title": "", "detail": "", "metric": "", "icon": "trending_up"}
  ],
  "recommendations": [
    {"priority": "high", "action": "", "reason": "", "expected_impact": ""}
  ],
  "best_performing_format": "reel",
  "optimal_posting_time": "18:30",
  "optimal_posting_days": ["Lunes", "Miercoles"]
}`,
      3000
    );

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      aiAnalysis = { content_score: 50, summary: "Analisis en progreso.", insights: [], recommendations: [] };
    }

    // Upsert report
    const report = {
      user_id: userId,
      report_date: now.toISOString().split("T")[0],
      report_type: type,
      total_posts: posts.length,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_saves: totalSaves,
      total_reach: totalReach,
      avg_engagement_rate: avgEng,
      best_post_id: bestPost?.id || null,
      worst_post_id: worstPost?.id || null,
      likes_trend: trend(totalLikes, prevLikes),
      comments_trend: trend(totalComments, prevComments),
      reach_trend: trend(totalReach, prevReach),
      engagement_trend: trend(avgEng, prevAvgEng),
      posting_frequency_trend: trend(posts.length, prev.length),
      format_breakdown: formatBreakdown,
      ai_insights: aiAnalysis.insights || [],
      ai_recommendations: aiAnalysis.recommendations || [],
      ai_content_score: aiAnalysis.content_score || 50,
      ai_summary: aiAnalysis.summary || "",
      best_hour: aiAnalysis.optimal_posting_time ? parseInt(aiAnalysis.optimal_posting_time.split(":")[0]) : null,
      best_day: aiAnalysis.optimal_posting_days?.[0] || null,
      top_hashtags: {},
    };

    const { data, error } = await supabase
      .from("analytics_reports")
      .upsert(report, { onConflict: "user_id,report_date,report_type" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAgentRun({
      userId,
      agentName: "analytics-generate",
      inputSummary: `Reporte ${type}: ${posts.length} posts, score ${aiAnalysis.content_score}`,
      outputData: { score: aiAnalysis.content_score, insightsCount: (aiAnalysis.insights || []).length },
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({ report: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
