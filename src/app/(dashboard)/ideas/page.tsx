"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { fetchSessions, type IdeaSession } from "@/lib/supabase/idea-sessions";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";
import { fetchScoredIdeas, updateIdeaStatus, type ScoredIdea } from "@/lib/supabase/program-output";
import GlassCardNew from "@/components/ui/GlassCardNew";

const fmtColors: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const fmtLabels: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const fmtBg: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const srcIcons: Record<string, string> = { journal: "📓", program: "🎯", ideas_bar: "💡", intel: "📰", daily_suggestion: "✨" };
const srcLabels: Record<string, string> = { journal: "Journal", program: "Programa", ideas_bar: "Ideas", intel: "Intel", daily_suggestion: "Daily" };

export default function IdeasPage() {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ hooks: { text: string; category: string }[]; ideas: { title: string; format: string; description: string }[] } | null>(null);
  const [scoredIdeas, setScoredIdeas] = useState<ScoredIdea[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sessions, setSessions] = useState<IdeaSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [writingCopy, setWritingCopy] = useState<string | null>(null);
  const [generatedCopies, setGeneratedCopies] = useState<Record<string, string>>({});

  function showToast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2500); }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
    fetchScoredIdeas({ status: "suggested", limit: 50 }).then(setScoredIdeas).catch(console.error);
    fetchSessions(10).then(setSessions).catch(console.error);
  }, []);

  async function handleGenerate() {
    if (!userId || !input.trim()) return;
    setGenerating(true); setCurrentResult(null);
    try {
      const res = await fetch("/api/agents/idea-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, input: input.trim() }) });
      const data = await res.json();
      if (data.hooks || data.ideas) {
        setCurrentResult({ hooks: data.hooks || [], ideas: data.ideas || [] });
        const refreshed = await fetchSessions(10);
        setSessions(refreshed);
        const newScored = await fetchScoredIdeas({ status: "suggested", limit: 50 });
        setScoredIdeas(newScored);
      }
    } catch (err) { console.error(err); }
    setGenerating(false);
  }

  async function handleWriteCopy(ideaId: string, hook: string, format: string) {
    if (!userId) return;
    setWritingCopy(ideaId);
    try {
      const res = await fetch("/api/agents/write-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, tema: hook, hook, formato: format }) });
      const data = await res.json();
      if (data.caption) setGeneratedCopies(p => ({ ...p, [ideaId]: data.caption }));
    } catch (err) { console.error(err); }
    setWritingCopy(null);
  }

  const sources = ["all", ...new Set(scoredIdeas.map(i => i.source).filter(Boolean))];
  const formats = ["all", ...new Set(scoredIdeas.map(i => i.format).filter(Boolean))];
  const filtered = scoredIdeas
    .filter(i => sourceFilter === "all" || i.source === sourceFilter)
    .filter(i => formatFilter === "all" || i.format === formatFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px]" style={{ fontFamily: "var(--font-display)" }}>Ideas</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Escribe una idea y genera 4 angulos. {scoredIdeas.length} ideas de {sources.length - 1} fuentes.
        </p>
      </div>

      {/* Input bar */}
      <GlassCardNew intensity="strong" className="p-3">
        <div className="flex gap-2 items-center">
          <span className="text-[14px] shrink-0" style={{ color: "var(--text-ghost)" }}>✎</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Que esta pasando por tu mente?"
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={!input.trim() || generating}
            className="px-4 py-1.5 rounded-[8px] text-white transition-opacity"
            style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "var(--olive-dark)", opacity: !input.trim() ? 0.4 : 1 }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : "Generar"}
          </button>
        </div>
      </GlassCardNew>

      {/* Generated result */}
      {currentResult && (
        <GlassCardNew intensity="subtle" className="p-4">
          <p className="text-[10px] mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
            De: &ldquo;{input.slice(0, 50)}...&rdquo;
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>HOOKS</span>
              {currentResult.hooks.map((h, i) => (
                <p key={i} className="text-[12px]" style={{ color: "var(--text-secondary)" }}>· {h.text}
                  <button onClick={() => { navigator.clipboard.writeText(h.text); showToast("Copiado"); }} className="text-[9px] ml-2 hover:text-white" style={{ color: "var(--text-ghost)" }}>copiar</button>
                  <button onClick={async () => { await createHook({ text: h.text, source: "idea_session", category: h.category }); showToast("Guardado"); }} className="text-[9px] text-[var(--olive)] ml-1">guardar</button>
                </p>
              ))}
            </div>
            <div className="space-y-1.5">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>IDEAS</span>
              {currentResult.ideas.map((idea, i) => (
                <div key={i} className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="text-[8px] rounded-[5px] px-1.5 py-0.5 mr-1" style={{ fontFamily: "var(--font-mono)", background: fmtBg[idea.format] || "var(--olive-bg)", color: fmtColors[idea.format] || "var(--olive)" }}>{fmtLabels[idea.format] || idea.format}</span>
                  {idea.title}
                </div>
              ))}
            </div>
          </div>
        </GlassCardNew>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
        {["all", "reel", "carousel", "story", "single"].map(fmt => (
          <button
            key={fmt}
            onClick={() => setFormatFilter(fmt)}
            className="shrink-0 px-3 py-2 text-[9px] transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: formatFilter === fmt ? "var(--olive)" : "var(--text-muted)",
              borderBottom: formatFilter === fmt ? "2px solid var(--olive)" : "2px solid transparent",
            }}
          >
            {fmt === "all" ? "Todas" : fmtLabels[fmt] || fmt}
          </button>
        ))}
      </div>

      {/* Source sub-filters */}
      <div className="flex flex-wrap gap-1.5">
        {sources.map(src => {
          const count = src === "all" ? scoredIdeas.length : scoredIdeas.filter(i => i.source === src).length;
          return (
            <button key={src} onClick={() => setSourceFilter(src)} className="text-[9px] px-2.5 py-1 rounded-[5px] transition-all" style={{ fontFamily: "var(--font-mono)", background: sourceFilter === src ? "var(--olive-bg)" : "rgba(255,255,255,0.04)", color: sourceFilter === src ? "var(--olive)" : "var(--text-muted)" }}>
              {src === "all" ? "Todas" : `${srcIcons[src] || ""} ${srcLabels[src] || src}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Ideas list */}
      <div className="space-y-0">
        {filtered.slice(0, 20).map((idea, idx) => {
          const opacity = idea.total_score >= 8 ? 1 : idea.total_score >= 7 ? 0.9 : idea.total_score >= 5 ? 0.75 : 0.5;
          return (
            <div
              key={idea.id}
              className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-[rgba(255,255,255,0.06)] group"
              style={{ opacity, borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              {/* Score */}
              <span className="text-[14px] min-w-[28px] text-center flex-shrink-0 pt-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--olive)" }}>
                {idea.total_score.toFixed(1)}
              </span>

              {/* Idea content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-[500] text-white truncate">{idea.hook}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{srcIcons[idea.source] || "·"} {srcLabels[idea.source] || idea.source}</span>
                  {idea.scheduled_date && <span className="text-[10px]" style={{ color: "var(--text-ghost)" }}>· {new Date(idea.scheduled_date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>

              {/* Format tag */}
              <span className="text-[8px] px-2 py-0.5 rounded-[5px] flex-shrink-0 mt-1" style={{ fontFamily: "var(--font-mono)", background: fmtBg[idea.format] || "var(--olive-bg)", color: fmtColors[idea.format] || "var(--olive)" }}>
                {fmtLabels[idea.format] || idea.format}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                <button
                  onClick={async () => {
                    const tm = new Date(); tm.setDate(tm.getDate() + 1);
                    const ds = tm.toLocaleDateString("en-CA");
                    await updateIdeaStatus(idea.id, "scheduled", ds);
                    await createPost({ caption: idea.hook + "\n\n" + (idea.description || ""), post_type: (idea.format === "carousel" ? "carousel" : idea.format === "story" ? "story" : idea.format === "single" ? "single" : "reel") as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: ds, platform: "instagram" });
                    setScoredIdeas(prev => prev.filter(i => i.id !== idea.id));
                    showToast("Programado");
                  }}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[12px] transition-colors hover:text-[var(--olive)]"
                  style={{ background: "var(--glass-subtle)", border: "1px solid var(--glass-border)", color: "var(--text-ghost)", backdropFilter: "blur(8px)" }}
                  title="Aprobar"
                >✓</button>
                <button
                  onClick={async () => { await updateIdeaStatus(idea.id, "rejected"); setScoredIdeas(prev => prev.filter(i => i.id !== idea.id)); }}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[12px] transition-colors hover:text-[var(--red)]"
                  style={{ background: "var(--glass-subtle)", border: "1px solid var(--glass-border)", color: "var(--text-ghost)", backdropFilter: "blur(8px)" }}
                  title="Rechazar"
                >×</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 20 && (
        <p className="text-center text-[10px]" style={{ color: "var(--text-ghost)" }}>+{filtered.length - 20} ideas mas</p>
      )}
      {filtered.length === 0 && (
        <GlassCardNew intensity="ghost" className="p-8 text-center">
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Genera ideas desde el input arriba o desde el Journal</p>
        </GlassCardNew>
      )}

      {/* History */}
      {sessions.length > 0 && (
        <>
          <div className="border-t pt-4 mt-2" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>SESIONES ANTERIORES</span>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <GlassCardNew key={s.id} intensity="ghost" className="overflow-hidden cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <div className="px-4 py-3">
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>&ldquo;{s.input_text.slice(0, 80)}{s.input_text.length > 80 ? "..." : ""}&rdquo;</p>
                  <p className="text-[9px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
                    {new Date(s.created_at).toLocaleDateString("es")} · {s.generated_hooks.length} hooks · {s.generated_ideas.length} ideas
                  </p>
                </div>
                {expandedId === s.id && (
                  <div className="px-4 pb-3 pt-1 border-t grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderColor: "var(--border)" }}>
                    <div className="space-y-1">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Hooks</span>
                      {s.generated_hooks.map((h, i) => <p key={i} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>· {h.text}</p>)}
                    </div>
                    <div className="space-y-1">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Ideas</span>
                      {s.generated_ideas.map((idea, i) => (
                        <p key={i} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          <span className="text-[8px] rounded-[5px] px-1 py-0.5 mr-1" style={{ fontFamily: "var(--font-mono)", background: fmtBg[idea.format] || "var(--olive-bg)", color: fmtColors[idea.format] || "var(--olive)" }}>{fmtLabels[idea.format] || idea.format}</span>
                          {idea.title}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCardNew>
            ))}
          </div>
        </>
      )}

      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 rounded-[8px] px-4 py-2.5 text-[12px] font-medium z-50" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-border)", color: "white" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
