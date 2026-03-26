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
import { fetchTopHotNews, type DailyNews } from "@/lib/supabase/daily-news";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/supabase/posts";
import { ErrorState } from "@/components/shared/states";
import { useLocale } from "@/lib/locale-context";
import { fetchScoredIdeas, fetchLatestOutput, updateIdeaStatus, type ScoredIdea, type ProgramOutput } from "@/lib/supabase/program-output";

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
  const { t } = useLocale();
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
  const [hotNews, setHotNews] = useState<DailyNews[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [scoredIdeas, setScoredIdeas] = useState<ScoredIdea[]>([]);
  const [latestOutput, setLatestOutput] = useState<ProgramOutput | null>(null);
  const [ideaSourceFilter, setIdeaSourceFilter] = useState<string>("all");

  const now = new Date();
  const hour = now.getHours();
  const greetingKey = hour < 12 ? "dashboard.greeting_morning" : hour < 18 ? "dashboard.greeting_afternoon" : "dashboard.greeting_evening";
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        // Load creator name
        const { data: profile } = await supabase.from("creators").select("full_name").eq("id", data.user.id).maybeSingle();
        if (profile?.full_name) setCreatorName(profile.full_name);
      }
    });

    Promise.all([
      fetchLatestReport().catch((e) => { console.error("Report:", e); return null; }),
      fetchTodaySuggestion().catch((e) => { console.error("Suggestion:", e); return null; }),
      fetchAgentRuns(5).catch((e) => { console.error("Runs:", e); return []; }),
      fetchPosts().catch((e) => { console.error("Posts:", e); return []; }),
      fetchTodayEntry().catch((e) => { console.error("Journal:", e); return null; }),
      fetchTopHotNews(3).catch((e) => { console.error("News:", e); return []; }),
      fetchScoredIdeas({ status: "suggested", limit: 20 }).catch(() => []),
      fetchLatestOutput().catch(() => null),
    ]).then(([r, s, a, p, j, hn, si, lo]) => {
      setReport(r);
      setSuggestion(s);
      setJournalEntry(j as JournalEntry | null);
      setHotNews((hn as DailyNews[]) || []);
      setRuns(a);
      setPosts(p);
      setScoredIdeas(si as ScoredIdea[]);
      setLatestOutput(lo as ProgramOutput | null);
      setLoading(false);
    }).catch((err) => {
      console.error("Dashboard load error:", err);
      setError(err.message || "Error loading dashboard");
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
    } catch (err) { console.error("Refresh error:", err); }
    setRefreshing(false);
  }

  async function handleGenerateContent() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/daily-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch (err) { console.error("Generate content error:", err); }
    setGenerating(false);
  }

  async function handleIdeaGenerate() {
    if (!userId || !ideaInput.trim()) return;
    setIdeaGenerating(true);
    try {
      const res = await fetch("/api/agents/idea-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, input: ideaInput.trim() }) });
      const data = await res.json();
      if (data.hooks || data.ideas) setIdeaResult({ hooks: data.hooks || [], ideas: data.ideas || [] });
    } catch (err) { console.error("Idea generate error:", err); }
    setIdeaGenerating(false);
  }

  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "published") return false;
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const dateKey = d.toLocaleDateString("en-CA"); // local date, not UTC
    const dayPost = posts.find((p) => p.scheduled_date === dateKey && p.status === "scheduled");
    return { day: dayNames[d.getDay()].slice(0, 3), date: d.getDate(), post: dayPost, isToday: i === 0 };
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">{t("common.loading")}</div>;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">
            {creatorName ? `${t(greetingKey)}, ${creatorName}` : t("dashboard.command_center")}
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            {dateStr}
            {latestOutput ? (() => {
              const temp = latestOutput.temperature_score || 5;
              const icon = temp >= 9 ? "\uD83D\uDCA5" : temp >= 7 ? "\uD83D\uDD25" : temp >= 4 ? "\u26A1" : "\u2744\uFE0F";
              const mode = temp >= 9 ? t("program_ideas.mode_explosive") : temp >= 7 ? t("program_ideas.mode_energetic") : temp >= 4 ? t("program_ideas.mode_educational") : t("program_ideas.mode_reflective");
              return ` · ${icon} ${temp}/10 · ${mode}`;
            })() : ""}
            {report?.ai_summary ? ` · ${report.ai_summary}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <GlowButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="ml-1.5">{refreshing ? t("dashboard.updating") : t("dashboard.update")}</span>
          </GlowButton>
          <GlowButton variant="primary" onClick={handleGenerateContent} disabled={generating}>
            {generating ? t("dashboard.generating") : t("dashboard.generate_content")}
          </GlowButton>
        </div>
      </div>

      {/* Idea Bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[var(--amber)]" />
            <p className="text-[14px] font-medium">{t("dashboard.idea_bar_title")}</p>
          </div>
          <div className="flex gap-2">
            <Textarea value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} placeholder={t("dashboard.idea_bar_placeholder")} className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[44px] flex-1" rows={1} />
            <GlowButton variant="primary" onClick={handleIdeaGenerate} disabled={!ideaInput.trim() || ideaGenerating} className="shrink-0 self-end">
              {ideaGenerating ? <Loader2 size={14} className="animate-spin" /> : `${t("dashboard.generate_ideas")} →`}
            </GlowButton>
          </div>
          {ideaResult && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("dashboard.hooks_label")}</p>
                {ideaResult.hooks.slice(0, 3).map((h, i) => (
                  <p key={i} className="text-[12px] text-[var(--text-secondary)]">· {h.text}</p>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("dashboard.ideas_label")}</p>
                {ideaResult.ideas.slice(0, 3).map((idea, i) => (
                  <p key={i} className="text-[12px] text-[var(--text-secondary)]">· [{idea.format}] {idea.title}</p>
                ))}
              </div>
              <Link href="/ideas" className="col-span-2 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">{t("dashboard.all_ideas")} →</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal / Briefing Preview */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={16} className="text-[var(--purple)]" />
              {journalEntry?.status === "completed" && journalEntry.generated_content ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("dashboard.briefing_today")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {journalEntry.mood && <span className="text-sm">{({"reflective":"🪞","fired_up":"🔥","frustrated":"😤","grateful":"🙏","philosophical":"🌌","determined":"💪","vulnerable":"🫣"} as Record<string,string>)[journalEntry.mood] || ""}</span>}
                    {(journalEntry.generated_content as Record<string,unknown>)?.content_plan ? <span className="text-[11px] text-[var(--text-secondary)]">3 {t("dashboard.posts_suggested")}</span> : null}
                    {((journalEntry.generated_content as Record<string,unknown>)?.hooks_bank as unknown[] | undefined)?.length ? <span className="text-[11px] text-[var(--text-secondary)]">· {String(((journalEntry.generated_content as Record<string,unknown>).hooks_bank as unknown[]).length)} hooks</span> : null}
                  </div>
                  {(journalEntry.generated_content as Record<string,unknown>)?.quote_of_the_day ? (
                    <p className="text-[12px] italic text-[var(--text-secondary)] mt-1">{`"${String((journalEntry.generated_content as Record<string,unknown>).quote_of_the_day)}"`}</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <p className="text-[13px] text-[var(--text-secondary)]">3 preguntas de {dayNames[now.getDay()].toUpperCase()} esperandote</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Genera tu briefing de contenido</p>
                </div>
              )}
            </div>
            <Link href="/journal" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              {journalEntry?.status === "completed" ? `${t("dashboard.view_briefing")} →` : `${t("dashboard.journal_open")} →`}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label={t("dashboard.posts_this_month")} value={publishedThisMonth} trend={report?.posting_frequency_trend} />
        <StatCard label={t("dashboard.engagement_avg")} value={report?.avg_engagement_rate || 0} suffix="%" trend={report?.engagement_trend} />
        <StatCard label={t("dashboard.total_reach")} value={report?.total_reach || 0} format trend={report?.reach_trend} />
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-[18px_20px] flex items-center justify-between" style={{ backgroundImage: "var(--satin)" }}>
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)] tracking-[0.02em] mb-2">{t("dashboard.content_score")}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{report ? t("dashboard.based_on_ai") : t("dashboard.no_analysis")}</p>
          </div>
          <ContentScore score={report?.ai_content_score || 0} />
        </div>
      </div>

      {/* Intel de hoy */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.intel_today")}</CardTitle>
          <CardAction><Link href="/news" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">{t("dashboard.see_all")} →</Link></CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {hotNews.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {hotNews.map((item) => {
                const urgEmoji = item.urgency === "hot" ? "🔴 HOT" : item.urgency === "warm" ? "🟡 WARM" : "🟢 EVER";
                const fmtLabel = (item.suggested_format || "single").charAt(0).toUpperCase() + (item.suggested_format || "single").slice(1);
                return (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium font-mono shrink-0">{urgEmoji}</span>
                        <p className="text-[12px] italic text-[var(--text-secondary)] truncate">&ldquo;{item.suggested_hook}&rdquo;</p>
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 ml-[52px]">{fmtLabel} · {item.source}</p>
                    </div>
                    <GlowButton className="shrink-0 text-[10px]" onClick={async () => { const tm = new Date(); tm.setDate(tm.getDate() + 1); await createPost({ caption: item.suggested_hook, post_type: (item.suggested_format || "single") as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: tm.toLocaleDateString("en-CA"), platform: "instagram" }); }}>
                      {t("dashboard.create_post")} →
                    </GlowButton>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <p className="text-[12px] text-[var(--text-tertiary)]">{t("intel.no_news")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Scored Ideas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("unified_ideas.title")}</CardTitle>
          <CardAction>
            {latestOutput && (
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {t("program_ideas.temperature")}: {(() => {
                  const temp = latestOutput.temperature_score || 5;
                  return `${temp >= 9 ? "\uD83D\uDCA5" : temp >= 7 ? "\uD83D\uDD25" : temp >= 4 ? "\u26A1" : "\u2744\uFE0F"} ${temp}/10`;
                })()}
              </span>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {scoredIdeas.length > 0 ? (<>
            <div className="px-5 pt-3 pb-2 flex gap-2 flex-wrap">
              {["all", "journal", "program", "ideas_bar", "intel", "daily_suggestion"].map((src) => {
                const labels: Record<string, string> = { all: t("unified_ideas.filter_all"), journal: t("unified_ideas.filter_journal"), program: t("unified_ideas.filter_program"), ideas_bar: t("unified_ideas.filter_ideas"), intel: t("unified_ideas.filter_intel"), daily_suggestion: "Daily" };
                const count = src === "all" ? scoredIdeas.length : scoredIdeas.filter(i => i.source === src).length;
                if (src !== "all" && count === 0) return null;
                return (
                  <button key={src} onClick={() => setIdeaSourceFilter(src)}
                    className={`text-[10px] px-2 py-1 rounded-[4px] border transition-colors ${ideaSourceFilter === src ? "border-[var(--text-primary)] text-[var(--text-primary)]" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}>
                    {labels[src] || src} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {scoredIdeas
                .filter((i) => ideaSourceFilter === "all" || i.source === ideaSourceFilter)
                .slice(0, 5)
                .map((idea) => {
                const fmtMap: Record<string, { label: string; cls: string }> = {
                  reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
                  carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
                  single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
                  story: { label: "STORY", cls: "bg-[var(--bg-hover)] text-[var(--green)]" },
                };
                const srcBadge: Record<string, { emoji: string; cls: string }> = {
                  journal: { emoji: "\uD83D\uDCD4", cls: "text-[var(--purple)]" },
                  program: { emoji: "\uD83C\uDFAF", cls: "text-[var(--green)]" },
                  ideas_bar: { emoji: "\uD83D\uDCA1", cls: "text-[var(--amber)]" },
                  intel: { emoji: "\uD83D\uDCF0", cls: "text-[var(--blue)]" },
                  daily_suggestion: { emoji: "\u2728", cls: "text-[var(--text-tertiary)]" },
                };
                const roleMap: Record<string, string> = { filter: "FILTRO", authority: "AUTORIDAD", conversion: "CONVERSION", brand: "MARCA" };
                const fl = fmtMap[idea.format] || fmtMap.single;
                const sb = srcBadge[idea.source || "program"] || srcBadge.program;
                return (
                  <div key={idea.id} className="px-5 py-3 flex items-start gap-3">
                    <span className="text-[14px] font-mono font-medium text-[var(--text-primary)] mt-0.5 shrink-0 w-8">{idea.total_score}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${fl.cls}`}>{fl.label}</span>
                        <span className="text-[9px] text-[var(--text-tertiary)] uppercase">{roleMap[idea.funnel_role] || idea.funnel_role}</span>
                        <span className={`text-[10px] ${sb.cls}`}>{sb.emoji}</span>
                      </div>
                      <p className="text-[12px] italic text-[var(--text-secondary)] truncate">&ldquo;{idea.hook}&rdquo;</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <GlowButton className="text-[10px]" onClick={async () => {
                        const tm = new Date(); tm.setDate(tm.getDate() + 1);
                        const dateStr = tm.toLocaleDateString("en-CA");
                        await updateIdeaStatus(idea.id, "scheduled", dateStr);
                        await createPost({ caption: idea.hook + "\n\n" + (idea.description || ""), post_type: (idea.format === "carousel" ? "carousel" : idea.format === "story" ? "story" : idea.format === "single" ? "single" : "reel") as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: dateStr, platform: "instagram" });
                        setScoredIdeas((prev) => prev.filter((i) => i.id !== idea.id));
                      }}>{t("unified_ideas.schedule")}</GlowButton>
                      <GlowButton variant="ghost" className="text-[10px]" onClick={async () => {
                        await updateIdeaStatus(idea.id, "rejected");
                        setScoredIdeas((prev) => prev.filter((i) => i.id !== idea.id));
                      }}>&times;</GlowButton>
                    </div>
                  </div>
                );
              })}
            </div>
            {scoredIdeas.filter(i => ideaSourceFilter === "all" || i.source === ideaSourceFilter).length > 5 && (
              <div className="px-5 py-2 text-center border-t border-[var(--border)]">
                <span className="text-[11px] text-[var(--text-tertiary)]">+{scoredIdeas.filter(i => ideaSourceFilter === "all" || i.source === ideaSourceFilter).length - 5} {t("unified_ideas.more")}</span>
              </div>
            )}
          </>) : (
            <div className="px-5 py-6 text-center">
              <p className="text-[12px] text-[var(--text-tertiary)]">{t("program_ideas.no_ideas")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.content_funnel")}</CardTitle>
            <CardAction><span className="text-[10px] text-[var(--text-tertiary)]">{t("dashboard.this_week")}</span></CardAction>
          </CardHeader>
          <CardContent>
            {(() => {
              const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
              const weekPosts = posts.filter((p) => p.status === "published" && new Date(p.created_at) >= weekAgo);
              const totalEng = weekPosts.reduce((s, p) => { const x = p as unknown as Record<string, unknown>; return s + (Number(x.likes_count) || 0) + (Number(x.comments_count) || 0); }, 0);
              const reach = weekPosts.reduce((s, p) => { const x = p as unknown as Record<string, unknown>; return s + (Number(x.reach) || Number(x.impressions) || 0); }, 0);
              const estimatedDMs = Math.round(totalEng * 0.05);
              const estimatedClients = Math.round(estimatedDMs * 0.35);
              const maxVal = Math.max(weekPosts.length, 1);

              const funnelData = [
                { label: "Publicaciones", value: weekPosts.length, pct: 100 },
                { label: "Alcance total", value: reach || Math.round(totalEng * 8), pct: reach > 0 ? Math.round((reach / (maxVal * 5000)) * 100) : 72 },
                { label: "Engagement", value: totalEng, pct: totalEng > 0 ? Math.min(Math.round((totalEng / (reach || 1)) * 100), 100) : 38 },
                { label: "DMs estimados", value: estimatedDMs, pct: Math.min(Math.round((estimatedDMs / Math.max(totalEng, 1)) * 100), 100) },
                { label: "Potenciales clientes", value: estimatedClients, pct: Math.min(Math.round((estimatedClients / Math.max(estimatedDMs, 1)) * 100), 100) },
              ];

              return (
                <div className="space-y-3">
                  {funnelData.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[var(--text-tertiary)]">{item.label}</span>
                        <span className="text-[12px] font-mono font-medium">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--text-primary)] rounded-full transition-all" style={{ width: `${Math.max(item.pct, 2)}%`, opacity: 1 - (i * 0.15) }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* AI Insights + Format Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* AI Insights */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.ai_insights")}</CardTitle>
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
                <p className="text-[13px] text-[var(--text-tertiary)]">{t("dashboard.no_insights")}</p>
                <GlowButton variant="primary" className="mt-3" onClick={handleRefresh} disabled={refreshing}>
                  {t("dashboard.generate_analysis")}
                </GlowButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format Performance */}
        <Card>
          <CardHeader><CardTitle>{t("dashboard.by_format")}</CardTitle></CardHeader>
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
                          {i === 0 && <span className="text-[9px] text-[var(--green)]">{t("dashboard.best")}</span>}
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
              <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">{t("dashboard.no_format_data")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.content_today")}</CardTitle>
          <CardAction>
            <GlowButton variant="ghost" onClick={handleGenerateContent} disabled={generating} className="text-[11px]">
              {generating ? t("dashboard.generating") : t("dashboard.regenerate")}
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
                    {t("dashboard.based_on_analysis")}: {formatLabels[suggestion.formato]?.label || suggestion.formato} {t("dashboard.is_best_format")}
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
                  }} disabled={generating}>{t("dashboard.generate_copy")}</GlowButton>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[13px] text-[var(--text-tertiary)]">{t("dashboard.no_suggestion")}</p>
              <GlowButton variant="primary" className="mt-3" onClick={handleGenerateContent} disabled={generating}>{t("dashboard.generate_now")}</GlowButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report?.ai_recommendations && report.ai_recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("dashboard.recommendations")}</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>{t("dashboard.recent_activity")}</CardTitle></CardHeader>
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
              <div className="text-center py-8 px-5 text-[13px] text-[var(--text-tertiary)]">{t("dashboard.no_activity")}</div>
            )}
          </CardContent>
        </Card>

        {/* Mini Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.next_7_days")}</CardTitle>
            <CardAction><Link href="/calendar" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">{t("dashboard.calendar")} →</Link></CardAction>
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
