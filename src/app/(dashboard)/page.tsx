"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TrendingUp, TrendingDown, Loader2, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchTodaySuggestion, type DailySuggestion } from "@/lib/supabase/daily-suggestions";
import { fetchAgentRuns, type AgentRun } from "@/lib/supabase/agent-runs";
import { fetchLatestReport, type AnalyticsReport } from "@/lib/supabase/analytics";
import { DbPost, fetchPosts } from "@/lib/supabase/posts";
import { fetchTodayEntry, type JournalEntry } from "@/lib/supabase/journal";
import { Textarea } from "@/components/ui/textarea";

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const insightIcons: Record<string, string> = {
  trending_up: "📈", trending_down: "📉", lightbulb: "💡", warning: "⚠️", star: "⭐",
};

const insightColors: Record<string, string> = {
  positive: "text-[var(--green)]", negative: "text-[var(--red)]",
  opportunity: "text-[var(--blue)]", neutral: "text-[var(--text-tertiary)]",
};

const formatLabels: Record<string, { label: string; cls: string }> = {
  reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
  carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
  single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
};

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-[10px] text-[var(--text-tertiary)]">—</span>;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${isUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function ContentScore({ score }: { score: number }) {
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--red)";
  const pct = Math.min(score, 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-medium font-mono" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">Content Score</p>
    </div>
  );
}

export default function CommandCenter() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaGenerating, setIdeaGenerating] = useState(false);
  const [ideaResult, setIdeaResult] = useState<{ hooks: { text: string; category: string }[]; ideas: { title: string; format: string; description: string }[] } | null>(null);

  const now = new Date();
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });

    Promise.all([
      fetchLatestReport().catch(() => null),
      fetchTodaySuggestion().catch(() => null),
      fetchAgentRuns(5).catch(() => []),
      fetchPosts().catch(() => []),
      fetchTodayEntry().catch(() => null),
    ]).then(([r, s, a, p, j]) => {
      setReport(r);
      setSuggestion(s);
      setJournalEntry(j as JournalEntry | null);
      setRuns(a);
      setPosts(p);
      setLoading(false);
    });
  }, []);

  async function handleRefresh() {
    if (!userId) return;
    setRefreshing(true);
    try {
      await fetch("/api/import/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      await fetch("/api/analytics/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, type: "weekly" }) });
      const newReport = await fetchLatestReport();
      const newPosts = await fetchPosts();
      setReport(newReport);
      setPosts(newPosts);
    } catch {}
    setRefreshing(false);
  }

  async function handleGenerateContent() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/daily-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch {}
    setGenerating(false);
  }

  async function handleIdeaGenerate() {
    if (!userId || !ideaInput.trim()) return;
    setIdeaGenerating(true);
    try {
      const res = await fetch("/api/agents/idea-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, input: ideaInput.trim() }) });
      const data = await res.json();
      if (data.hooks || data.ideas) setIdeaResult({ hooks: data.hooks || [], ideas: data.ideas || [] });
    } catch {}
    setIdeaGenerating(false);
  }

  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "published") return false;
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayPost = posts.find((p) => p.scheduled_date === dateKey && p.status === "scheduled");
    return { day: dayNames[d.getDay()].slice(0, 3), date: d.getDate(), post: dayPost, isToday: i === 0 };
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando command center...</div>;

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Command Center</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            {dateStr} {report?.ai_summary ? `· ${report.ai_summary}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <GlowButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="ml-1.5">{refreshing ? "Actualizando..." : "Actualizar"}</span>
          </GlowButton>
          <GlowButton variant="primary" onClick={handleGenerateContent} disabled={generating}>
            {generating ? "Generando..." : "Generar contenido"}
          </GlowButton>
        </div>
      </div>

      {/* Idea Bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[var(--amber)]" />
            <p className="text-[14px] font-medium">Que tienes en mente hoy?</p>
          </div>
          <div className="flex gap-2">
            <Textarea value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} placeholder="Ej: hoy un alumno me pregunto por que le duele la espalda al hacer peso muerto..." className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[44px] flex-1" rows={1} />
            <GlowButton variant="primary" onClick={handleIdeaGenerate} disabled={!ideaInput.trim() || ideaGenerating} className="shrink-0 self-end">
              {ideaGenerating ? <Loader2 size={14} className="animate-spin" /> : "Generar →"}
            </GlowButton>
          </div>
          {ideaResult && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Hooks</p>
                {ideaResult.hooks.slice(0, 3).map((h, i) => (
                  <p key={i} className="text-[12px] text-[var(--text-secondary)]">· {h.text}</p>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Ideas</p>
                {ideaResult.ideas.slice(0, 3).map((idea, i) => (
                  <p key={i} className="text-[12px] text-[var(--text-secondary)]">· [{idea.format}] {idea.title}</p>
                ))}
              </div>
              <Link href="/ideas" className="col-span-2 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Ver todas las ideas →</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal Preview */}
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={16} className="text-[var(--purple)]" />
            {journalEntry?.status === "completed" && journalEntry.generated_content?.quote_of_the_day ? (
              <div>
                <p className="text-[13px] font-medium italic">"{journalEntry.generated_content.quote_of_the_day}"</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Frase del dia · {journalEntry.mood ? `${journalEntry.mood}` : ""}</p>
              </div>
            ) : (
              <div>
                <p className="text-[13px] text-[var(--text-secondary)]">Tienes 3 preguntas esperandote</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Tu reflexion diaria alimenta tu contenido mas autentico</p>
              </div>
            )}
          </div>
          <Link href="/journal" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            {journalEntry?.status === "completed" ? "Ver →" : "Abrir diario →"}
          </Link>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Posts este mes" value={publishedThisMonth} trend={report?.posting_frequency_trend} />
        <StatCard label="Engagement avg" value={report?.avg_engagement_rate || 0} suffix="%" trend={report?.engagement_trend} />
        <StatCard label="Alcance total" value={report?.total_reach || 0} format trend={report?.reach_trend} />
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-[18px_20px] flex items-center justify-between" style={{ backgroundImage: "var(--satin)" }}>
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)] tracking-[0.02em] mb-2">Content Score</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{report ? "Basado en IA" : "Sin analisis"}</p>
          </div>
          <ContentScore score={report?.ai_content_score || 0} />
        </div>
      </div>

      {/* AI Insights + Format Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* AI Insights */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardAction>
              {report && <span className="text-[10px] text-[var(--text-tertiary)]">{formatRelative(report.created_at)}</span>}
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {report?.ai_insights && report.ai_insights.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {report.ai_insights.slice(0, 5).map((insight, i) => (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className={`text-base mt-0.5 ${insightColors[insight.type] || ""}`}>
                        {insightIcons[insight.icon] || "💡"}
                      </span>
                      <div>
                        <p className="text-[13px] font-medium">{insight.title}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{insight.detail}</p>
                        {insight.metric && <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1">{insight.metric}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-[var(--text-tertiary)]">Sin insights todavia</p>
                <GlowButton variant="primary" className="mt-3" onClick={handleRefresh} disabled={refreshing}>
                  Generar analisis
                </GlowButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format Performance */}
        <Card>
          <CardHeader><CardTitle>Por formato</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report?.format_breakdown && Object.keys(report.format_breakdown).length > 0 ? (
              Object.entries(report.format_breakdown)
                .sort(([, a], [, b]) => b.avg_engagement - a.avg_engagement)
                .map(([fmt, data], i) => {
                  const maxEng = Math.max(...Object.values(report.format_breakdown).map((d) => d.avg_engagement));
                  const pct = maxEng > 0 ? (data.avg_engagement / maxEng) * 100 : 0;
                  const fl = formatLabels[fmt];
                  return (
                    <div key={fmt} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${fl?.cls || "bg-[var(--bg-hover)] text-[var(--text-secondary)]"}`}>
                            {fl?.label || fmt}
                          </span>
                          {i === 0 && <span className="text-[9px] text-[var(--green)]">MEJOR</span>}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-secondary)]">{data.avg_engagement}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--text-primary)] rounded-full transition-all" style={{ width: `${pct}%`, opacity: 0.6 + (pct / 250) }} />
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{data.count} posts · avg {data.avg_likes} likes</p>
                    </div>
                  );
                })
            ) : (
              <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">Sin datos de formato</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido del dia</CardTitle>
          <CardAction>
            <GlowButton variant="ghost" onClick={handleGenerateContent} disabled={generating} className="text-[11px]">
              {generating ? "Generando..." : "Regenerar"}
            </GlowButton>
          </CardAction>
        </CardHeader>
        <CardContent>
          {suggestion ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${formatLabels[suggestion.formato]?.cls || ""}`}>
                  {formatLabels[suggestion.formato]?.label || suggestion.formato}
                </span>
                {report?.format_breakdown && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Basado en analisis: {formatLabels[suggestion.formato]?.label || suggestion.formato} es tu formato con mejor performance
                  </span>
                )}
              </div>
              <p className="text-[15px] font-medium tracking-[-0.01em]">{suggestion.tema}</p>
              <p className="text-[13px] italic text-[var(--text-secondary)]">"{suggestion.hook}"</p>
              {suggestion.generated_copy ? (
                <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                  {suggestion.generated_copy}
                </div>
              ) : (
                <div className="flex gap-2">
                  <GlowButton variant="primary" onClick={async () => {
                    if (!userId) return;
                    setGenerating(true);
                    const res = await fetch("/api/agents/write-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, tema: suggestion.tema, hook: suggestion.hook, formato: suggestion.formato }) });
                    const data = await res.json();
                    if (data.caption) setSuggestion({ ...suggestion, generated_copy: data.caption });
                    setGenerating(false);
                  }} disabled={generating}>Generar copy</GlowButton>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[13px] text-[var(--text-tertiary)]">Sin sugerencia para hoy</p>
              <GlowButton variant="primary" className="mt-3" onClick={handleGenerateContent} disabled={generating}>Generar ahora</GlowButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report?.ai_recommendations && report.ai_recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recomendaciones</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {report.ai_recommendations.map((rec, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] uppercase ${
                    rec.priority === "high" ? "bg-[var(--red-bg)] text-[var(--red)]" : rec.priority === "medium" ? "bg-[var(--amber-bg)] text-[var(--amber)]" : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                  }`}>{rec.priority}</span>
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

      {/* Activity + Pipeline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent className="p-0">
            {runs.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {runs.map((run) => (
                  <div key={run.id} className="flex gap-3 px-5 py-3 items-start">
                    <span className={`mt-1.5 w-[7px] h-[7px] rounded-full shrink-0 ${run.status === "completed" ? "bg-[var(--green)]" : "bg-[var(--amber)]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">{run.agent_name}</strong> — {run.input_summary}</p>
                      <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{formatRelative(run.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-5 text-[13px] text-[var(--text-tertiary)]">Sin actividad todavia</div>
            )}
          </CardContent>
        </Card>

        {/* Mini Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Proximos 7 dias</CardTitle>
            <CardAction><Link href="/calendar" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Calendario →</Link></CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {next7.map((d, i) => (
                <div key={i} className={`text-center p-3 rounded-[6px] border transition-colors ${d.post ? "border-[var(--border-focus)] bg-[var(--bg-hover)]" : "border-[var(--border)]"} ${d.isToday ? "ring-1 ring-[var(--text-primary)]/20" : ""}`}>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase">{d.day}</p>
                  <p className="text-[14px] font-medium font-mono mt-0.5">{d.date}</p>
                  {d.post ? (
                    <span className={`inline-flex mt-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${formatLabels[d.post.post_type]?.cls || ""}`}>
                      {formatLabels[d.post.post_type]?.label || d.post.post_type}
                    </span>
                  ) : <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">—</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, suffix, format }: { label: string; value: number; trend?: number | null; suffix?: string; format?: boolean }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-[18px_20px] transition-[border-color] duration-150 hover:border-[var(--border-focus)]" style={{ backgroundImage: "var(--satin)" }}>
      <p className="text-[11px] text-[var(--text-tertiary)] tracking-[0.02em] mb-2">{label}</p>
      <p className="text-[26px] font-medium tracking-[-0.03em] font-mono">
        {format ? formatNum(value) : value}{suffix || ""}
      </p>
      <div className="mt-1.5"><TrendBadge value={trend ?? null} /></div>
    </div>
  );
}
