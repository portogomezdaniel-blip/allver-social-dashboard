"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { fetchSessions, type IdeaSession } from "@/lib/supabase/idea-sessions";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";
import { fetchScoredIdeas, updateIdeaStatus, type ScoredIdea } from "@/lib/supabase/program-output";
import GlassCard from "@/components/mirror/GlassCard";
import LayerLabel from "@/components/mirror/LayerLabel";
import LayerDivider from "@/components/mirror/LayerDivider";
import ScoreCard from "@/components/mirror/ScoreCard";

const fmtColors: Record<string, string> = { reel: "var(--filter)", carousel: "var(--authority)", story: "var(--conversion)", single: "var(--brand)" };
const fmtLabels: Record<string, string> = { reel: "REEL", carousel: "CARRUSEL", story: "STORY", single: "SINGLE" };
const srcIcons: Record<string, string> = { journal: "\uD83D\uDCD4", program: "\uD83C\uDFAF", ideas_bar: "\uD83D\uDCA1", intel: "\uD83D\uDCF0", daily_suggestion: "\u2728" };
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
    <div className="max-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[24px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Tus ideas</h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {scoredIdeas.length} ideas de {sources.length - 1} fuentes &middot; Ordenadas por potencial
        </p>
      </div>

      {/* Input */}
      <div className="max-w-[600px] mx-auto">
        <GlassCard intensity="medium" className="p-4">
          <div className="flex gap-2">
            <span className="text-[16px] mt-1.5 shrink-0 opacity-40">{"\u25CE"}</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Que esta pasando por tu mente?"
              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button onClick={handleGenerate} disabled={!input.trim() || generating} className="px-4 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: "var(--middle)", color: "var(--black)" }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : "Generar \u2192"}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Generated result */}
      {currentResult && (
        <GlassCard intensity="subtle" className="p-5 max-w-[600px] mx-auto">
          <p className="text-[10px] text-[var(--text-muted)] mb-3">Ideas de: &ldquo;{input.slice(0, 50)}...&rdquo;</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">HOOKS</span>
              {currentResult.hooks.map((h, i) => (
                <p key={i} className="text-[12px] text-[var(--text-secondary)]">&middot; {h.text}
                  <button onClick={() => { navigator.clipboard.writeText(h.text); showToast("Copiado"); }} className="text-[9px] text-[var(--text-muted)] ml-2 hover:text-[var(--text-secondary)]">copiar</button>
                  <button onClick={async () => { await createHook({ text: h.text, source: "idea_session", category: h.category }); showToast("Guardado"); }} className="text-[9px] text-[var(--olive)] ml-1">guardar</button>
                </p>
              ))}
            </div>
            <div className="space-y-1.5">
              <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">IDEAS</span>
              {currentResult.ideas.map((idea, i) => (
                <div key={i} className="text-[12px] text-[var(--text-secondary)]">
                  <span className="text-[8px] font-mono" style={{ color: fmtColors[idea.format] || "var(--olive)" }}>{fmtLabels[idea.format] || idea.format}</span> {idea.title}
                  <button onClick={async () => { const tm = new Date(); tm.setDate(tm.getDate() + 1); await createPost({ caption: `${idea.title}\n\n${idea.description}`, post_type: idea.format as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: tm.toLocaleDateString("en-CA"), platform: "instagram" }); showToast("Post creado"); }} className="text-[9px] text-[var(--olive)] ml-2">crear &rarr;</button>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      <LayerDivider />
      <LayerLabel layer="middle" label="IDEAS RANKEADAS POR POTENCIAL" />

      {/* Source filters */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {sources.map(src => {
          const count = src === "all" ? scoredIdeas.length : scoredIdeas.filter(i => i.source === src).length;
          return (
            <button key={src} onClick={() => setSourceFilter(src)} className="text-[10px] px-2.5 py-1 rounded-lg transition-all" style={{ background: sourceFilter === src ? "var(--middle-bg)" : "rgba(0,0,0,0.12)", color: sourceFilter === src ? "var(--olive)" : "var(--text-muted)" }}>
              {src === "all" ? "Todas" : `${srcIcons[src] || ""} ${srcLabels[src] || src}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Format sub-filters */}
      <div className="flex flex-wrap gap-1 justify-center">
        {formats.map(fmt => (
          <button key={fmt} onClick={() => setFormatFilter(fmt)} className="text-[9px] px-2 py-0.5 rounded-md transition-all" style={{ background: formatFilter === fmt ? `${fmtColors[fmt] || "var(--olive)"}15` : "transparent", color: formatFilter === fmt ? (fmtColors[fmt] || "var(--olive)") : "var(--text-muted)" }}>
            {fmt === "all" ? "Todos" : fmtLabels[fmt] || fmt}
          </button>
        ))}
      </div>

      {/* Scored ideas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.slice(0, 12).map((idea, idx) => (
          <div key={idea.id}>
            <ScoreCard score={idea.total_score} hook={idea.hook} format={idea.format} funnelRole={idea.funnel_role} source={idea.source || "program"}>
              {/* Actions for top ideas */}
              {generatedCopies[idea.id] && <div className="p-2.5 rounded-[12px] bg-[rgba(0,0,0,0.08)] border border-[var(--border-ghost)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line mt-2 leading-relaxed">{generatedCopies[idea.id]}</div>}
              {idx < 6 && (
                <div className="flex gap-1.5 mt-2.5">
                  <button onClick={async () => {
                    const tm = new Date(); tm.setDate(tm.getDate() + 1);
                    const ds = tm.toLocaleDateString("en-CA");
                    await updateIdeaStatus(idea.id, "scheduled", ds);
                    await createPost({ caption: idea.hook + "\n\n" + (idea.description || ""), post_type: (idea.format === "carousel" ? "carousel" : idea.format === "story" ? "story" : idea.format === "single" ? "single" : "reel") as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: ds, platform: "instagram" });
                    setScoredIdeas(prev => prev.filter(i => i.id !== idea.id));
                    showToast("Programado");
                  }} className="text-[9px] px-2.5 py-1 rounded-md" style={{ background: "rgba(168,183,142,0.12)", color: "var(--olive)" }}>Programar</button>
                  <button onClick={() => handleWriteCopy(idea.id, idea.hook, idea.format)} disabled={writingCopy === idea.id} className="text-[9px] px-2.5 py-1 rounded-md" style={{ background: "rgba(155,126,184,0.1)", color: "var(--depth)" }}>
                    {writingCopy === idea.id ? "..." : "Copy IA"}
                  </button>
                  <button onClick={async () => { await updateIdeaStatus(idea.id, "rejected"); setScoredIdeas(prev => prev.filter(i => i.id !== idea.id)); }} className="text-[9px] px-1.5 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
                </div>
              )}
            </ScoreCard>
          </div>
        ))}
      </div>

      {filtered.length > 12 && (
        <p className="text-center text-[10px] text-[var(--text-muted)]">+{filtered.length - 12} ideas mas</p>
      )}
      {filtered.length === 0 && (
        <GlassCard intensity="ghost" className="p-8 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">Genera ideas desde el input arriba o desde el Journal</p>
        </GlassCard>
      )}

      {/* History */}
      {sessions.length > 0 && (
        <>
          <LayerDivider />
          <p className="text-center text-[10px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">SESIONES ANTERIORES</p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <GlassCard key={s.id} intensity="ghost" className="overflow-hidden cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <div className="px-4 py-3">
                  <p className="text-[12px] text-[var(--text-secondary)]">&ldquo;{s.input_text.slice(0, 80)}{s.input_text.length > 80 ? "..." : ""}&rdquo;</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">
                    {new Date(s.created_at).toLocaleDateString("es")} &middot; {s.generated_hooks.length} hooks &middot; {s.generated_ideas.length} ideas
                  </p>
                </div>
                {expandedId === s.id && (
                  <div className="px-4 pb-3 pt-1 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--text-muted)]">Hooks</span>
                      {s.generated_hooks.map((h, i) => <p key={i} className="text-[11px] text-[var(--text-secondary)]">&middot; {h.text}</p>)}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--text-muted)]">Ideas</span>
                      {s.generated_ideas.map((idea, i) => (
                        <p key={i} className="text-[11px] text-[var(--text-secondary)]">
                          <span className="text-[8px] font-mono" style={{ color: fmtColors[idea.format] || "var(--olive)" }}>{fmtLabels[idea.format] || idea.format}</span> {idea.title}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 backdrop-blur-sm rounded-lg px-4 py-2.5 text-[12px] font-medium z-50" style={{ background: "rgba(0,0,0,0.3)", border: "0.5px solid var(--glass-border)", color: "var(--text-primary)" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
