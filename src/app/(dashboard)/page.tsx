"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchTodaySuggestion, type DailySuggestion } from "@/lib/supabase/daily-suggestions";
import { fetchLatestReport, type AnalyticsReport } from "@/lib/supabase/analytics";
import { DbPost, fetchPosts, createPost } from "@/lib/supabase/posts";
import { fetchTodayEntry, type JournalEntry } from "@/lib/supabase/journal";
import { fetchTopHotNews, type DailyNews } from "@/lib/supabase/daily-news";
import { ErrorState } from "@/components/shared/states";
import { useLocale } from "@/lib/locale-context";
import { fetchScoredIdeas, fetchLatestOutput, updateIdeaStatus, type ScoredIdea, type ProgramOutput } from "@/lib/supabase/program-output";
import TemperatureOrb from "@/components/mirror/TemperatureOrb";
import LayerLabel from "@/components/mirror/LayerLabel";
import LayerDivider from "@/components/mirror/LayerDivider";
import GlassCard from "@/components/mirror/GlassCard";

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const fmtColors: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const fmtLabels: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const roleLabels: Record<string, string> = { filter: "Filtro", authority: "Autoridad", conversion: "CTA", brand: "Marca" };
const srcIcons: Record<string, string> = { journal: "\uD83D\uDCD4", program: "\uD83C\uDFAF", ideas_bar: "\uD83D\uDCA1", intel: "\uD83D\uDCF0", daily_suggestion: "\u2728" };
const moodEmojis: Record<string, string> = { reflective: "\uD83E\uDE9E", fired_up: "\uD83D\uDD25", frustrated: "\uD83D\uDE24", grateful: "\uD83D\uDE4F", philosophical: "\uD83C\uDF0C", determined: "\uD83D\uDCAA", vulnerable: "\uD83E\uDEE3" };

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function Home() {
  const { t } = useLocale();
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}`;
  const temp = latestOutput?.temperature_score || 5;
  const tempColor = temp >= 7 ? "var(--surface)" : temp >= 4 ? "var(--middle)" : "var(--depth)";
  const tempMsg = temp >= 7 ? "Tu energia pide contenido polarizante hoy." : temp >= 4 ? "Modo estable. Contenido educativo consistente." : "Momento de reflexion. Contenido profundo.";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        const { data: profile } = await supabase.from("creators").select("full_name").eq("id", data.user.id).maybeSingle();
        if (profile?.full_name) setCreatorName(profile.full_name);
      }
    });
    Promise.all([
      fetchLatestReport().catch(() => null),
      fetchTodaySuggestion().catch(() => null),
      fetchPosts().catch(() => []),
      fetchTodayEntry().catch(() => null),
      fetchTopHotNews(3).catch(() => []),
      fetchScoredIdeas({ status: "suggested", limit: 20 }).catch(() => []),
      fetchLatestOutput().catch(() => null),
    ]).then(([r, s, p, j, hn, si, lo]) => {
      setReport(r); setSuggestion(s); setPosts(p); setJournalEntry(j as JournalEntry | null);
      setHotNews((hn as DailyNews[]) || []); setScoredIdeas(si as ScoredIdea[]); setLatestOutput(lo as ProgramOutput | null);
      setLoading(false);
    }).catch((err) => { setError(err.message || "Error"); setLoading(false); });
  }, []);

  async function handleGenerateContent() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/daily-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch (err) { console.error(err); }
    setGenerating(false);
  }

  async function handleIdeaGenerate() {
    if (!userId || !ideaInput.trim()) return;
    setIdeaGenerating(true);
    try {
      const res = await fetch("/api/agents/idea-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, input: ideaInput.trim() }) });
      const data = await res.json();
      if (data.hooks || data.ideas) setIdeaResult({ hooks: data.hooks || [], ideas: data.ideas || [] });
    } catch (err) { console.error(err); }
    setIdeaGenerating(false);
  }

  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "published") return false;
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const dateKey = d.toLocaleDateString("en-CA");
    const dayPost = posts.find((p) => p.scheduled_date === dateKey && p.status === "scheduled");
    return { day: dayNames[d.getDay()].slice(0, 1), date: d.getDate(), post: dayPost, isToday: i === 0 };
  });
  const weekCoverage = next7.filter(d => d.post).length;

  // Best idea = top scored idea or daily suggestion
  const bestIdea = scoredIdeas[0] || null;

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-[var(--text-muted)] text-sm">...</div>;
  if (error) return <ErrorState message={error} />;

  // ====== SURFACE COLUMN ======
  const surfaceColumn = (
    <div className="space-y-4">
      <LayerLabel layer="surface" label="SUPERFICIE \u00B7 ACT\u00DAA" />

      {/* Post of the day */}
      <GlassCard intensity="strong" className="p-5">
        {(bestIdea || suggestion) ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {bestIdea && <span className="text-[24px] font-[800] font-mono" style={{ color: "var(--olive)" }}>{bestIdea.total_score}</span>}
              <span className="text-[9px] px-2 py-[2px] rounded-md" style={{ background: `${fmtColors[bestIdea?.format || suggestion?.formato || "reel"]}15`, color: fmtColors[bestIdea?.format || suggestion?.formato || "reel"] }}>
                {fmtLabels[bestIdea?.format || suggestion?.formato || "reel"]} &middot; {roleLabels[bestIdea?.funnel_role || "filter"]}
              </span>
              {bestIdea?.source && <span className="text-[10px] text-[var(--text-muted)]">{srcIcons[bestIdea.source]}</span>}
            </div>
            <p className="text-[15px] leading-relaxed mb-3" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
              &ldquo;{bestIdea?.hook || suggestion?.hook || ""}&rdquo;
            </p>
            <div className="flex gap-2">
              <button onClick={async () => {
                if (!bestIdea && !suggestion) return;
                const hook = bestIdea?.hook || suggestion?.hook || "";
                const desc = bestIdea?.description || suggestion?.razonamiento || "";
                const fmt = bestIdea?.format || suggestion?.formato || "reel";
                const tm = new Date(); tm.setDate(tm.getDate() + 1);
                const dateStr = tm.toLocaleDateString("en-CA");
                if (bestIdea) await updateIdeaStatus(bestIdea.id, "scheduled", dateStr);
                await createPost({ caption: hook + "\n\n" + desc, post_type: fmt as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: dateStr, platform: "instagram" });
                if (bestIdea) setScoredIdeas(prev => prev.filter(i => i.id !== bestIdea.id));
              }} className="text-[11px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
                Crear ahora
              </button>
              <button onClick={handleGenerateContent} disabled={generating} className="text-[11px] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                {generating ? "..." : "Regenerar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[12px] text-[var(--text-muted)] mb-2">{t("dashboard.no_suggestion")}</p>
            <button onClick={handleGenerateContent} disabled={generating} className="text-[11px] px-3 py-1.5 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
              {generating ? "Generando..." : "Generar contenido"}
            </button>
          </div>
        )}
      </GlassCard>

      {/* Intel compact */}
      <GlassCard intensity="subtle" className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">INTEL</span>
          <Link href="/news" className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">Ver todas &rarr;</Link>
        </div>
        {hotNews.length > 0 ? (
          <div className="space-y-2">
            {hotNews.map(item => {
              const dot = item.urgency === "hot" ? "var(--surface)" : item.urgency === "warm" ? "var(--amber)" : "var(--olive)";
              return (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="w-[6px] h-[6px] rounded-full mt-1.5 shrink-0" style={{ background: dot }} />
                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">&ldquo;{item.suggested_hook}&rdquo;</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-muted)]">Sin noticias hoy</p>
        )}
      </GlassCard>

      {/* Mini week */}
      <GlassCard intensity="ghost" className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">SEMANA</span>
          <Link href="/calendar" className="text-[9px] text-[var(--text-muted)]">{weekCoverage}/7 &rarr;</Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {next7.map((d, i) => (
            <div key={i} className={`text-center py-1.5 rounded-lg ${d.isToday ? "ring-1 ring-[var(--olive)]/30" : ""}`} style={{ background: d.post ? "rgba(168,183,142,0.08)" : "transparent" }}>
              <p className="text-[9px] text-[var(--text-muted)]">{d.day}</p>
              <p className="text-[13px] font-mono font-medium">{d.date}</p>
              {d.post && <span className="text-[8px]" style={{ color: fmtColors[d.post.post_type] || "var(--olive)" }}>{fmtLabels[d.post.post_type]?.[0] || "\u2022"}</span>}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  // ====== MIDDLE COLUMN ======
  const middleColumn = (
    <div className="space-y-4">
      <LayerLabel layer="middle" label="MEDIO \u00B7 PIENSA" />

      {/* Idea input */}
      <GlassCard intensity="medium" className="p-4">
        <p className="text-[12px] text-[var(--text-muted)] mb-2">Que esta pasando por tu mente?</p>
        <div className="flex gap-2">
          <input
            value={ideaInput}
            onChange={(e) => setIdeaInput(e.target.value)}
            placeholder="Una idea, una duda, algo que te dijo un alumno..."
            className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--border-focus)]"
            onKeyDown={(e) => e.key === "Enter" && handleIdeaGenerate()}
          />
          <button onClick={handleIdeaGenerate} disabled={!ideaInput.trim() || ideaGenerating} className="px-3 py-2 rounded-lg text-[12px] font-medium" style={{ background: "var(--middle)", color: "var(--black)" }}>
            {ideaGenerating ? <Loader2 size={14} className="animate-spin" /> : "\u2192"}
          </button>
        </div>
        {ideaResult && (
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
            {ideaResult.hooks.slice(0, 3).map((h, i) => (
              <p key={i} className="text-[11px] text-[var(--text-secondary)]">&middot; {h.text}</p>
            ))}
            <Link href="/ideas" className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">Ver todas &rarr;</Link>
          </div>
        )}
      </GlassCard>

      {/* Scored ideas */}
      <div className="space-y-2">
        {scoredIdeas.slice(0, 6).map((idea, idx) => {
          const opacity = idea.total_score >= 8.5 ? 1 : idea.total_score >= 7 ? 0.85 : idea.total_score >= 5 ? 0.65 : 0.4;
          const bgAlpha = idea.total_score >= 8.5 ? 0.22 : idea.total_score >= 7 ? 0.15 : 0.1;
          return (
            <div key={idea.id} className="backdrop-blur-sm rounded-[16px] p-3.5" style={{ opacity, background: `rgba(0,0,0,${bgAlpha})`, border: `0.5px solid rgba(168,183,142,${bgAlpha * 0.5})` }}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-[800] font-mono" style={{ color: idea.total_score >= 8.5 ? "var(--olive)" : idea.total_score >= 7 ? "var(--text-secondary)" : "var(--text-muted)" }}>{idea.total_score}</span>
                  <span className="text-[8px] px-1.5 py-[1px] rounded-md" style={{ background: `${fmtColors[idea.format] || "var(--olive)"}15`, color: fmtColors[idea.format] || "var(--olive)" }}>
                    {fmtLabels[idea.format] || idea.format} &middot; {roleLabels[idea.funnel_role] || idea.funnel_role}
                  </span>
                  <span className="text-[9px]">{srcIcons[idea.source || "program"]}</span>
                </div>
                {idx < 3 && (
                  <div className="flex gap-1">
                    <button onClick={async () => {
                      const tm = new Date(); tm.setDate(tm.getDate() + 1);
                      const ds = tm.toLocaleDateString("en-CA");
                      await updateIdeaStatus(idea.id, "scheduled", ds);
                      await createPost({ caption: idea.hook + "\n\n" + (idea.description || ""), post_type: (idea.format === "carousel" ? "carousel" : idea.format === "story" ? "story" : idea.format === "single" ? "single" : "reel") as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: ds, platform: "instagram" });
                      setScoredIdeas(prev => prev.filter(i => i.id !== idea.id));
                    }} className="text-[9px] px-2 py-1 rounded-md" style={{ background: "rgba(168,183,142,0.12)", color: "var(--olive)" }}>Programar</button>
                    <button onClick={async () => { await updateIdeaStatus(idea.id, "rejected"); setScoredIdeas(prev => prev.filter(i => i.id !== idea.id)); }} className="text-[9px] px-1.5 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
                  </div>
                )}
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: idea.total_score >= 7 ? "var(--text-secondary)" : "var(--text-muted)", fontStyle: idea.total_score >= 8 ? "italic" : "normal", fontFamily: idea.total_score >= 8 ? "var(--font-serif)" : "inherit" }}>
                &ldquo;{idea.hook}&rdquo;
              </p>
            </div>
          );
        })}
        {scoredIdeas.length > 6 && (
          <Link href="/ideas" className="block text-center text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-2">+{scoredIdeas.length - 6} mas &rarr;</Link>
        )}
        {scoredIdeas.length === 0 && (
          <GlassCard intensity="ghost" className="p-4 text-center">
            <p className="text-[11px] text-[var(--text-muted)]">Genera contenido para ver ideas rankeadas aqui</p>
          </GlassCard>
        )}
      </div>
    </div>
  );

  // ====== DEPTH COLUMN ======
  const depthColumn = (() => {
    const quote = journalEntry?.generated_content
      ? String((journalEntry.generated_content as Record<string, unknown>)?.quote_of_the_day || "")
      : "";

    return (
      <div className="space-y-4">
        <LayerLabel layer="depth" label="PROFUNDIDAD \u00B7 SIENTE" />

        {/* Journal card */}
        <GlassCard intensity="medium" className="p-4" onClick={() => {}}>
          <Link href="/journal" className="block">
            {journalEntry?.status === "completed" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {journalEntry.mood && <span className="text-sm">{moodEmojis[journalEntry.mood] || ""}</span>}
                  <span className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--depth)]">BRIEFING DE HOY</span>
                </div>
                {quote && <p className="text-[13px] italic leading-relaxed text-[var(--text-secondary)] mb-2" style={{ fontFamily: "var(--font-serif)" }}>&ldquo;{quote}&rdquo;</p>}
                <span className="text-[9px] text-[var(--text-muted)]">Ver briefing completo &rarr;</span>
              </div>
            ) : (
              <div>
                <p className="text-[13px] text-[var(--text-secondary)] mb-1">3 preguntas de {dayNames[now.getDay()].toUpperCase()}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Abre tu diario y genera contenido desde tus reflexiones</p>
                <span className="text-[9px] text-[var(--depth)] mt-2 inline-block">Abrir diario &rarr;</span>
              </div>
            )}
          </Link>
        </GlassCard>

        {/* Knowledge count */}
        <GlassCard intensity="ghost" className="p-4">
          <Link href="/journal/knowledge" className="block">
            <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">BASE DE CONOCIMIENTO</span>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Fragmentos de tu esencia almacenados</p>
            <span className="text-[9px] text-[var(--text-muted)] mt-1 inline-block">Explorar &rarr;</span>
          </Link>
        </GlassCard>

        {/* Stats — whisper */}
        <div className="space-y-2" style={{ opacity: 0.35 }}>
          <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">NUMEROS</span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[18px] font-mono font-[800]">{publishedThisMonth}</p>
              <p className="text-[8px] text-[var(--text-muted)]">posts</p>
            </div>
            <div>
              <p className="text-[18px] font-mono font-[800]">{report?.avg_engagement_rate || 0}%</p>
              <p className="text-[8px] text-[var(--text-muted)]">engage</p>
            </div>
            <div>
              <p className="text-[18px] font-mono font-[800]">{formatNum(report?.total_reach || 0)}</p>
              <p className="text-[8px] text-[var(--text-muted)]">alcance</p>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <div>
      {/* Header — greeting + temperature */}
      <div className="text-center mb-8 md:text-left md:flex md:items-center md:justify-between">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-[11px] text-[var(--text-muted)] font-mono tracking-wide">{dateStr}</p>
          <h1 className="text-[24px] md:text-[28px] font-[800] tracking-[-0.03em] mt-1" style={{ fontFamily: "var(--font-display)" }}>
            {greeting}{creatorName ? `, ${creatorName}` : ""}
          </h1>
          <p className="text-[11px] mt-1" style={{ color: tempColor }}>{tempMsg}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <TemperatureOrb temperature={temp} size="sm" />
        </div>
      </div>

      {/* Mobile: vertical scroll with layer dividers */}
      <div className="md:hidden space-y-0">
        {surfaceColumn}
        <LayerDivider />
        {middleColumn}
        <LayerDivider />
        {depthColumn}
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-6">
        {surfaceColumn}
        {middleColumn}
        {depthColumn}
      </div>
    </div>
  );
}
