"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchLatestReport, fetchReportHistory, type AnalyticsReport } from "@/lib/supabase/analytics";
import { fetchPosts, type DbPost } from "@/lib/supabase/posts";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const insightIcons: Record<string, string> = { trending_up: "📈", trending_down: "📉", lightbulb: "💡", warning: "⚠️", star: "⭐" };
const insightColors: Record<string, string> = { positive: "text-[var(--green)]", negative: "text-[var(--red)]", opportunity: "text-[var(--blue)]", neutral: "text-[var(--text-tertiary)]" };

export default function AnalyticsPage() {
  const { t } = useLocale();
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [history, setHistory] = useState<AnalyticsReport[]>([]);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
    Promise.all([
      fetchLatestReport(reportType).catch(() => null),
      fetchReportHistory(4).catch(() => []),
      fetchPosts().catch(() => []),
    ]).then(([r, h, p]) => { setReport(r); setHistory(h); setPosts(p); setLoading(false); });
  }, [reportType]);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/analytics/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, type: reportType }) });
      const data = await res.json();
      if (data.report) { setReport(data.report); setHistory((prev) => [data.report, ...prev.slice(0, 3)]); }
    } catch {}
    setGenerating(false);
  }

  // Format breakdown chart data
  const formatData = report?.format_breakdown
    ? Object.entries(report.format_breakdown).map(([fmt, d]) => ({ name: fmt.toUpperCase(), engagement: d.avg_engagement, posts: d.count, likes: d.avg_likes }))
    : [];

  const scoreColor = (report?.ai_content_score || 0) >= 70 ? "var(--green)" : (report?.ai_content_score || 0) >= 40 ? "var(--amber)" : "var(--red)";

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">{t("analytics.loading")}</div>;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">{t("analytics.title")}</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-[6px] border border-[var(--border)] overflow-hidden">
            <button onClick={() => setReportType("weekly")} className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${reportType === "weekly" ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>{t("analytics.weekly")}</button>
            <button onClick={() => setReportType("monthly")} className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${reportType === "monthly" ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>{t("analytics.monthly")}</button>
          </div>
          <GlowButton variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? t("analytics.generating") : t("analytics.generate")}
          </GlowButton>
        </div>
      </div>

      {report ? (
        <>
          {/* Content Score + Summary */}
          <Card>
            <CardContent className="pt-6 pb-6 flex items-center gap-8">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="2.5" strokeDasharray={`${report.ai_content_score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-medium font-mono" style={{ color: scoreColor }}>{report.ai_content_score}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase">Score</span>
                </div>
              </div>
              <div>
                <p className="text-[15px] font-medium">{report.ai_summary}</p>
                <div className="flex gap-6 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">Posts:</span>
                    <span className="text-[13px] font-mono font-medium">{report.total_posts}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">Likes:</span>
                    <span className="text-[13px] font-mono font-medium">{report.total_likes}</span>
                    {report.likes_trend !== null && (
                      <span className={`text-[10px] ${(report.likes_trend || 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {(report.likes_trend || 0) >= 0 ? "+" : ""}{report.likes_trend}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">Engagement:</span>
                    <span className="text-[13px] font-mono font-medium">{report.avg_engagement_rate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Breakdown Chart */}
          {formatData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Performance por formato</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: 12 }} />
                      <Bar dataKey="engagement" fill="var(--text-primary)" radius={[0, 4, 4, 0]} name="Engagement avg" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {report.ai_insights && report.ai_insights.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Insights de IA</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {report.ai_insights.map((insight, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-2.5">
                      <span className={`text-base mt-0.5 ${insightColors[insight.type] || ""}`}>{insightIcons[insight.icon] || "💡"}</span>
                      <div>
                        <p className="text-[13px] font-medium">{insight.title}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{insight.detail}</p>
                        {insight.metric && <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1">{insight.metric}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.ai_recommendations && report.ai_recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recomendaciones</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {report.ai_recommendations.map((rec, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] uppercase ${rec.priority === "high" ? "bg-[var(--red-bg)] text-[var(--red)]" : rec.priority === "medium" ? "bg-[var(--amber-bg)] text-[var(--amber)]" : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]"}`}>{rec.priority}</span>
                      <div>
                        <p className="text-[13px] font-medium">{rec.action}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{rec.reason}</p>
                        <p className="text-[11px] text-[var(--green)] mt-0.5">{rec.expected_impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report History */}
          {history.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Historial de reportes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-[6px] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{h.report_date}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">{h.report_type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] font-mono">{h.total_posts} posts</span>
                        <span className="text-[12px] font-mono" style={{ color: (h.ai_content_score || 0) >= 70 ? "var(--green)" : (h.ai_content_score || 0) >= 40 ? "var(--amber)" : "var(--red)" }}>
                          Score: {h.ai_content_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-[15px] text-[var(--text-secondary)]">{t("analytics.no_reports")}</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{t("analytics.no_reports_detail")}</p>
            <GlowButton variant="primary" className="mt-4" onClick={handleGenerate} disabled={generating}>
              {generating ? t("analytics.generating") : t("analytics.generate_first")}
            </GlowButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
