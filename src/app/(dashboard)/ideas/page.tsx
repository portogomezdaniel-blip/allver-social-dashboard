"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { fetchSessions, type IdeaSession } from "@/lib/supabase/idea-sessions";
import { createHook } from "@/lib/supabase/hooks";
import { fetchScoredIdeas, updateIdeaStatus, type ScoredIdea } from "@/lib/supabase/program-output";
import GlassCardNew from "@/components/ui/GlassCardNew";
import IdeaActionPanel from "@/components/ideas/IdeaActionPanel";
import { Toast } from "@/components/ui/Toast";

const fmtLabels: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const fmtBg: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const fmtColors: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const srcIcons: Record<string, string> = { journal: "\uD83D\uDCD3", program: "\uD83C\uDFAF", ideas_bar: "\uD83D\uDCA1", intel: "\uD83D\uDCF0", daily_suggestion: "\u2728" };
const srcLabels: Record<string, string> = { journal: "Journal", program: "Programa", ideas_bar: "Ideas", intel: "Intel", daily_suggestion: "Daily" };

export default function IdeasPage() {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ hooks: { text: string; category: string }[]; ideas: { title: string; format: string; description: string }[] } | null>(null);
  const [ideas, setIdeas] = useState<ScoredIdea[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sessions, setSessions] = useState<IdeaSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleToastDone = useCallback(() => setToast(null), []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
    fetchScoredIdeas({ limit: 60 }).then(setIdeas).catch(console.error);
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
        setSessions(await fetchSessions(10));
        setIdeas(await fetchScoredIdeas({ limit: 60 }));
        setToast("Ideas generadas");
      }
    } catch (err) { console.error(err); }
    setGenerating(false);
  }

  // ─── Idea action handlers ────────────────────────────────
  async function handleAssignToDay(ideaId: string, date: string) {
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, scheduled_date: date, status: "approved" } : i));
    setExpandedIdeaId(null);
    const supabase = createClient();
    await supabase.from("scored_content_ideas").update({ scheduled_date: date, status: "approved" }).eq("id", ideaId);
    const label = new Date(date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long" });
    setToast(`Idea asignada al ${label}`);
  }

  async function handleChangeFormat(ideaId: string, newFormat: string) {
    const funnel_role = newFormat === "carousel" ? "authority" : newFormat === "story" ? "conversion" : newFormat === "single" ? "conversion" : "filter";
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, format: newFormat, funnel_role } : i));
    const supabase = createClient();
    await supabase.from("scored_content_ideas").update({ format: newFormat, funnel_role }).eq("id", ideaId);
    setToast(`Formato cambiado a ${fmtLabels[newFormat] || newFormat}`);
  }

  async function handleMarkRecordToday(ideaId: string) {
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: "approved" } : i));
    setExpandedIdeaId(null);
    const supabase = createClient();
    await supabase.from("scored_content_ideas").update({ status: "approved" }).eq("id", ideaId);
    setToast("Marcada para grabar hoy");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast("Copiado al portapapeles");
  }

  function handleKeep(ideaId: string) {
    setExpandedIdeaId(null);
    setToast("Idea guardada");
  }

  async function handleReject(ideaId: string) {
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    setExpandedIdeaId(null);
    await updateIdeaStatus(ideaId, "rejected");
    setToast("Idea descartada");
  }

  // ─── Computed ────────────────────────────────────────────
  const sources = useMemo(() => ["all", ...new Set(ideas.map(i => i.source).filter(Boolean))], [ideas]);
  const filtered = useMemo(() => ideas
    .filter(i => sourceFilter === "all" || i.source === sourceFilter)
    .filter(i => formatFilter === "all" || i.format === formatFilter)
  , [ideas, sourceFilter, formatFilter]);

  const daysWithContent = useMemo(() => [...new Set(ideas.filter(i => i.scheduled_date).map(i => i.scheduled_date!))], [ideas]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px]" style={{ fontFamily: "var(--font-display)" }}>Ideas</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Escribe una idea y genera 4 angulos. {ideas.length} ideas de {sources.length - 1} fuentes.
        </p>
      </div>

      {/* Input bar */}
      <GlassCardNew intensity="strong" className="p-3">
        <div className="flex gap-2 items-center">
          <span className="text-[14px] shrink-0" style={{ color: "var(--text-ghost)" }}>{"\u270E"}</span>
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
                <p key={i} className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{"\u00B7"} {h.text}
                  <button onClick={() => { navigator.clipboard.writeText(h.text); setToast("Copiado"); }} className="text-[9px] ml-2 hover:text-white" style={{ color: "var(--text-ghost)" }}>copiar</button>
                  <button onClick={async () => { await createHook({ text: h.text, source: "idea_session", category: h.category }); setToast("Hook guardado"); }} className="text-[9px] text-[var(--olive)] ml-1">guardar</button>
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
          const count = src === "all" ? ideas.length : ideas.filter(i => i.source === src).length;
          return (
            <button key={src} onClick={() => setSourceFilter(src)} className="text-[9px] px-2.5 py-1 rounded-[5px] transition-all" style={{ fontFamily: "var(--font-mono)", background: sourceFilter === src ? "var(--olive-bg)" : "rgba(255,255,255,0.04)", color: sourceFilter === src ? "var(--olive)" : "var(--text-muted)" }}>
              {src === "all" ? "Todas" : `${srcIcons[src] || ""} ${srcLabels[src] || src}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Ideas list with action panels */}
      <div>
        {filtered.slice(0, 30).map(idea => (
          <IdeaActionPanel
            key={idea.id}
            idea={idea}
            isExpanded={expandedIdeaId === idea.id}
            onToggle={() => setExpandedIdeaId(prev => prev === idea.id ? null : idea.id)}
            onAssignToDay={handleAssignToDay}
            onChangeFormat={handleChangeFormat}
            onMarkRecordToday={handleMarkRecordToday}
            onCopy={handleCopy}
            onKeep={handleKeep}
            onReject={handleReject}
            daysWithContent={daysWithContent}
          />
        ))}
      </div>

      {filtered.length > 30 && (
        <p className="text-center text-[10px]" style={{ color: "var(--text-ghost)" }}>+{filtered.length - 30} ideas mas</p>
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
                    {new Date(s.created_at).toLocaleDateString("es")} {"\u00B7"} {s.generated_hooks.length} hooks {"\u00B7"} {s.generated_ideas.length} ideas
                  </p>
                </div>
                {expandedId === s.id && (
                  <div className="px-4 pb-3 pt-1 border-t grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderColor: "var(--border)" }}>
                    <div className="space-y-1">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Hooks</span>
                      {s.generated_hooks.map((h, i) => <p key={i} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{"\u00B7"} {h.text}</p>)}
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

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}
