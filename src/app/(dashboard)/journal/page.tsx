"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type JournalEntry } from "@/lib/supabase/journal";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";
import { getTodayQuestions, getQuestionsForDay } from "@/lib/journal-questions";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import GlassCardNew from "@/components/ui/GlassCardNew";

const domainColors: Record<string, string> = { practice: "var(--green)", clients: "var(--blue)", philosophy: "var(--purple)" };
const domainLabels: Record<string, string> = { practice: "TU PRACTICA", clients: "TUS CLIENTES", philosophy: "FILOSOFIA" };
const moodEmojis: Record<string, string> = { reflective: "\uD83E\uDE9E", fired_up: "\uD83D\uDD25", frustrated: "\uD83D\uDE24", grateful: "\uD83D\uDE4F", philosophical: "\uD83C\uDF0C", determined: "\uD83D\uDCAA", vulnerable: "\uD83E\uDEE3" };
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dayColors: Record<number, string> = { 0: "var(--text-muted)", 1: "var(--green)", 2: "var(--blue)", 3: "var(--purple)", 4: "var(--amber)", 5: "var(--red)", 6: "var(--blue)" };
const fmtColors: Record<string, string> = { reel: "var(--filter)", carousel: "var(--authority)", story: "var(--conversion)", single: "var(--brand)", story_series: "var(--conversion)" };

function copyText(text: string) { navigator.clipboard.writeText(text); }
function getLocalDateString(): string { return new Date().toLocaleDateString("en-CA"); }
function formatHistoryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${dayNames[date.getDay()]}, ${d} ${monthNames[m - 1]}`;
}

export default function JournalPage() {
  const { t } = useLocale();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [a1, setA1] = useState(""); const [a2, setA2] = useState(""); const [a3, setA3] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [generatingCopy, setGeneratingCopy] = useState<string | null>(null);
  const [generatedCopies, setGeneratedCopies] = useState<Record<string, string>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [questionsCollapsed, setQuestionsCollapsed] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const todayQuestions = getTodayQuestions();
  const questionStartNum = dayOfWeek * 3 + 1;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id; setUserId(uid);
      const todayDate = getLocalDateString();
      const qs = getTodayQuestions();
      const { data: existing } = await supabase.from("journal_entries").select("*").eq("user_id", uid).eq("entry_date", todayDate).maybeSingle();
      if (existing) { setEntry(existing); setA1(existing.answer_1 || ""); setA2(existing.answer_2 || ""); setA3(existing.answer_3 || ""); }
      else {
        const { data: ne } = await supabase.from("journal_entries").insert({ user_id: uid, entry_date: todayDate, question_1: qs.questions[0].text, question_2: qs.questions[1].text, question_3: qs.questions[2].text, status: "pending" }).select().single();
        if (ne) setEntry(ne);
      }
      const { data: hist } = await supabase.from("journal_entries").select("*").eq("user_id", uid).neq("entry_date", todayDate).order("entry_date", { ascending: false }).limit(14);
      setHistory(hist ?? []); setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userId || !entry || entry.status === "completed" || (!a1 && !a2 && !a3)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.from("journal_entries").update({ answer_1: a1 || null, answer_2: a2 || null, answer_3: a3 || null, status: "in_progress" }).eq("id", entry.id);
      setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2000);
    }, 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [a1, a2, a3, userId, entry]);

  async function handleSubmit() {
    if (!userId || !entry || !canSubmit) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agents/journal-analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, entryId: entry.id, question_1: entry.question_1, question_2: entry.question_2, question_3: entry.question_3, answer_1: a1, answer_2: a2, answer_3: a3 }) });
      const data = await res.json();
      if (data.content || data.briefing) {
        const briefing = data.briefing || data.content;
        setEntry({ ...entry, answer_1: a1, answer_2: a2, answer_3: a3, status: "completed", generated_content: data.content || briefing, mood: briefing.mood, themes: briefing.themes });
        fetch("/api/agents/extract-knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, journalEntryId: entry.id }) }).catch(() => {});
      }
    } catch (err) { console.error(err); } setAnalyzing(false);
  }

  async function handleWriteCopy(key: string, tema: string, hook: string, formato: string) {
    if (!userId) return;
    setGeneratingCopy(key);
    try {
      const res = await fetch("/api/agents/write-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, tema, hook, formato }) });
      const data = await res.json();
      if (data.caption) setGeneratedCopies((p) => ({ ...p, [key]: data.caption }));
    } catch (err) { console.error(err); } setGeneratingCopy(null);
  }

  async function handleAddToCalendar(caption: string, format: string) {
    await createPost({ caption, post_type: format as "reel" | "carousel" | "single" | "story", status: "draft", scheduled_date: null, platform: "instagram" });
  }

  async function handleApplyWeeklyPlan(strategy: Record<string, { format: string; topic: string }>) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const startDate = new Date();
    const dow = startDate.getDay();
    const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
    startDate.setDate(startDate.getDate() + daysUntilMonday);
    for (let i = 0; i < days.length; i++) {
      const plan = strategy[days[i]];
      if (!plan) continue;
      const date = new Date(startDate); date.setDate(date.getDate() + i);
      await createPost({ caption: `[${plan.format.toUpperCase()}] ${plan.topic}`, post_type: (plan.format === "story_series" ? "story" : plan.format) as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: date.toLocaleDateString("en-CA"), platform: "instagram" });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-[var(--text-muted)] text-sm">...</div>;

  const b = entry?.generated_content as Record<string, unknown> | null;
  const isCompleted = entry?.status === "completed" && b;
  const canSubmit = a1.trim().length >= 20 && a2.trim().length >= 20 && a3.trim().length >= 20;
  const qItems = [
    { q: entry?.question_1 || todayQuestions.questions[0].text, a: a1, set: setA1, domain: todayQuestions.questions[0].domain },
    { q: entry?.question_2 || todayQuestions.questions[1].text, a: a2, set: setA2, domain: todayQuestions.questions[1].domain },
    { q: entry?.question_3 || todayQuestions.questions[2].text, a: a3, set: setA3, domain: todayQuestions.questions[2].domain },
  ];
  const hero = (b?.content_plan as Record<string, unknown>)?.hero_post as Record<string, unknown> | null;
  const secondaryPosts = ((b?.content_plan as Record<string, unknown>)?.secondary_posts || []) as Record<string, unknown>[];
  const hooksBank = (b?.hooks_bank || []) as { text: string; category: string; power_score: number }[];
  const storyIdeas = (b?.story_ideas || []) as { type: string; content: string; engagement_tactic: string }[];
  const carousel = b?.carousel_structure as { title: string; slides: { slide: number; type: string; content: string }[] } | null;
  const weeklyStrategy = b?.weekly_strategy as Record<string, unknown> | null;
  const repurpose = (b?.repurpose_ideas || []) as { from: string; to: string; how: string }[];
  const brandNote = b?.personal_brand_note as string | null;
  const quote = b?.quote_of_the_day as string | null;

  const tabs = [
    { id: "hero", label: "Hero Post" },
    { id: "posts", label: "Posts Extra" },
    { id: "hooks", label: `Hooks (${hooksBank.length})` },
    { id: "stories", label: "Stories" },
    { id: "carousel", label: "Carrusel" },
    { id: "week", label: "Semana" },
    { id: "repurpose", label: "Repurpose" },
  ];

  return (
    <div className="max-w-[680px] mx-auto space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="mb-2">
        <h1 className="text-[18px] md:text-[22px]" style={{ fontFamily: "var(--font-display)" }}>Journal</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>
          3 preguntas de hoy. Tus respuestas generan ideas de contenido.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>
            {dayNames[dayOfWeek]} · Preguntas {questionStartNum}–{questionStartNum + 2} de 21
          </span>
          {autoSaved && <span className="text-[9px] text-[var(--olive)]">Guardado ✓</span>}
          <Link href="/journal/knowledge" className="text-[9px] text-[var(--text-ghost)] hover:text-[var(--text-secondary)] ml-auto">Base de conocimiento →</Link>
        </div>
      </div>

      {/* ═══ QUESTIONS ═══ */}
      {isCompleted && (
        <div className="text-center">
          <button onClick={() => setQuestionsCollapsed(!questionsCollapsed)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] inline-flex items-center gap-1">
            {questionsCollapsed ? <><ChevronRight size={12} /> Mostrar respuestas</> : <><ChevronDown size={12} /> Ocultar respuestas</>}
          </button>
        </div>
      )}

      {!questionsCollapsed && (
        <div className="space-y-4">
          {qItems.map((item, i) => (
            <GlassCardNew key={i} intensity="strong" className="p-5" borderLeft={domainColors[item.domain]}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: domainColors[item.domain] }}>
                  {domainLabels[item.domain]}
                </span>
                <p className="text-[13px] font-[500] mt-2 mb-3" style={{ color: "var(--text-primary)" }}>
                  {item.q}
                </p>
                {isCompleted ? (
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{item.a}</p>
                ) : (
                  <>
                    <textarea
                      value={item.a}
                      onChange={(e) => item.set(e.target.value)}
                      placeholder="Escribe sin filtro..."
                      className="w-full border rounded-[6px] px-3 py-2.5 text-[12px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none min-h-[50px] md:min-h-[60px] resize-y"
                      style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" }}
                      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--olive)"; (e.target as HTMLTextAreaElement).style.background = "rgba(255,255,255,0.12)"; }}
                      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.target as HTMLTextAreaElement).style.background = "rgba(255,255,255,0.08)"; }}
                    />
                    {item.a.length > 0 && item.a.length < 20 && <p className="text-[9px] text-[var(--text-muted)] mt-1">{20 - item.a.length} caracteres mas</p>}
                  </>
                )}
              </div>
            </GlassCardNew>
          ))}

          {!isCompleted && (
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || analyzing}
                className="w-full md:w-auto px-5 py-2.5 rounded-[8px] transition-all"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  background: canSubmit ? "var(--olive-dark)" : "rgba(255,255,255,0.04)",
                  color: canSubmit ? "white" : "var(--text-ghost)",
                  opacity: canSubmit ? 1 : 0.5,
                }}
              >
                {analyzing ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Generando...</span> : "Generar ideas desde mis respuestas"}
              </button>
              <p className="text-[8px] mt-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
                {[a1, a2, a3].filter(a => a.trim().length >= 20).length} de 3 respondidas
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ BRIEFING ═══ */}
      {isCompleted ? (
        <>
          <div className="border-t pt-4 mt-2" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>IDEAS GENERADAS DEL JOURNAL</span>
          </div>

          {/* Mood + themes */}
          <GlassCardNew intensity="subtle" className="p-4">
            <div className="flex items-center gap-3">
              {entry?.mood && <span className="text-lg">{moodEmojis[entry.mood] || ""}</span>}
              <div>
                {entry?.mood && <p className="text-[12px] font-medium capitalize">{entry.mood.replace("_", " ")}</p>}
                <div className="flex gap-1.5 mt-1">
                  {entry?.themes?.map((tag, i) => <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.12)", color: "var(--text-secondary)" }}>#{tag}</span>)}
                </div>
              </div>
            </div>
          </GlassCardNew>

          {/* Quote */}
          {quote && (
            <GlassCardNew intensity="medium" className="p-5" >
              <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--amber)] mb-2 block">FRASE DEL DIA</span>
              <p className="text-[18px] leading-relaxed" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => copyText(quote)} className="text-[10px] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><Copy size={10} className="inline mr-1" />Copiar</button>
                <button onClick={async () => { await createPost({ caption: quote, post_type: "story", status: "draft", scheduled_date: null, platform: "instagram" }); }} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "var(--depth)", color: "var(--text-primary)" }}>Guardar como story</button>
              </div>
            </GlassCardNew>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="shrink-0 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all" style={{ background: activeTab === tab.id ? "var(--depth)" : "rgba(0,0,0,0.12)", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Hero Post */}
          {activeTab === "hero" && hero && (
            <GlassCardNew intensity="medium" className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[8px] px-2 py-[2px] rounded-md" style={{ background: `${fmtColors[hero.format as string] || "var(--olive)"}15`, color: fmtColors[hero.format as string] || "var(--olive)" }}>{(hero.format as string || "").toUpperCase()}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{hero.best_time as string}</span>
              </div>
              <p className="text-[15px] font-[800]" style={{ fontFamily: "var(--font-display)" }}>{hero.title as string}</p>
              <div className="p-3 rounded-[12px]" style={{ background: "rgba(0,0,0,0.12)", border: "0.5px solid var(--border)" }}>
                <span className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--text-muted)] mb-1 block">HOOK</span>
                <p className="text-[14px] italic" style={{ fontFamily: "var(--font-serif)" }}>&ldquo;{hero.hook as string}&rdquo;</p>
                <button onClick={() => copyText(hero.hook as string)} className="text-[9px] text-[var(--text-muted)] mt-1 hover:text-[var(--text-secondary)]">Copiar hook</button>
              </div>
              {(hero.outline as string[])?.length > 0 && (
                <div>
                  <span className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--text-muted)] mb-1 block">ESTRUCTURA</span>
                  <ol className="space-y-1">{(hero.outline as string[]).map((p, i) => <li key={i} className="text-[12px] text-[var(--text-secondary)]">{i + 1}. {p}</li>)}</ol>
                </div>
              )}
              <p className="text-[11px] text-[var(--text-secondary)]"><strong>CTA:</strong> {hero.cta as string}</p>
              <div className="flex flex-wrap gap-1">{(hero.hashtags as string[] || []).map((h, i) => <span key={i} className="text-[9px] text-[var(--text-muted)]">#{h}</span>)}</div>
              {(hero.why as string) && <p className="text-[11px] text-[var(--olive)] italic">{hero.why as string}</p>}
              {generatedCopies["hero"] && <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.1)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{generatedCopies["hero"]}</div>}
              <div className="flex gap-2">
                <button onClick={() => handleWriteCopy("hero", hero.title as string, hero.hook as string, hero.format as string)} disabled={generatingCopy === "hero"} className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--depth)", color: "var(--text-primary)" }}>
                  {generatingCopy === "hero" ? "..." : "Crear con IA \u2192"}
                </button>
                <button onClick={() => handleAddToCalendar(hero.hook as string, hero.format as string)} className="text-[10px] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Calendario</button>
              </div>
            </GlassCardNew>
          )}

          {/* Secondary Posts */}
          {activeTab === "posts" && secondaryPosts.length > 0 && (
            <div className="space-y-3">
              {secondaryPosts.map((post, i) => (
                <GlassCardNew key={i} intensity="subtle" className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] px-2 py-[2px] rounded-md" style={{ background: `${fmtColors[post.format as string] || "var(--olive)"}15`, color: fmtColors[post.format as string] || "var(--olive)" }}>{(post.format as string || "").toUpperCase()}</span>
                    <p className="text-[13px] font-medium">{post.title as string}</p>
                  </div>
                  <p className="text-[12px] italic text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-serif)" }}>&ldquo;{post.hook as string}&rdquo;</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{post.brief as string}</p>
                  {generatedCopies[`sec-${i}`] && <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.1)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line">{generatedCopies[`sec-${i}`]}</div>}
                  <div className="flex gap-2">
                    <button onClick={() => handleWriteCopy(`sec-${i}`, post.title as string, post.hook as string, post.format as string)} disabled={generatingCopy === `sec-${i}`} className="text-[9px] px-2 py-1 rounded-md" style={{ background: "rgba(155,126,184,0.12)", color: "var(--depth)" }}>{generatingCopy === `sec-${i}` ? "..." : "IA"}</button>
                    <button onClick={() => handleAddToCalendar(post.hook as string, post.format as string)} className="text-[9px] px-2 py-1 rounded-md text-[var(--text-muted)] border border-[var(--border)]">Cal</button>
                  </div>
                </GlassCardNew>
              ))}
            </div>
          )}

          {/* Hooks */}
          {activeTab === "hooks" && hooksBank.length > 0 && (
            <div className="space-y-2">
              {hooksBank.map((h, i) => (
                <GlassCardNew key={i} intensity="subtle" className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="text-[14px] font-mono font-[800]" style={{ color: "var(--amber)" }}>{h.power_score}/10</span>
                    <div className="flex-1">
                      <p className="text-[13px]" style={{ fontFamily: h.power_score >= 8 ? "var(--font-serif)" : "inherit", fontStyle: h.power_score >= 8 ? "italic" : "normal" }}>{h.text}</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.1)", color: "var(--text-muted)" }}>{h.category}</span>
                        <button onClick={() => copyText(h.text)} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">Copiar</button>
                        <button onClick={async () => await createHook({ text: h.text, source: "journal", category: h.category })} className="text-[9px] text-[var(--olive)]">Guardar</button>
                      </div>
                    </div>
                  </div>
                </GlassCardNew>
              ))}
            </div>
          )}

          {/* Stories */}
          {activeTab === "stories" && storyIdeas.length > 0 && (
            <div className="space-y-2">
              {storyIdeas.map((s, i) => (
                <GlassCardNew key={i} intensity="ghost" className="p-3.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md uppercase" style={{ background: "rgba(0,0,0,0.1)", color: "var(--text-muted)" }}>{s.type}</span>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1.5">{s.content}</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-1">{s.engagement_tactic}</p>
                </GlassCardNew>
              ))}
            </div>
          )}

          {/* Carousel */}
          {activeTab === "carousel" && carousel && (
            <GlassCardNew intensity="medium" className="p-5 space-y-3">
              <p className="text-[14px] font-[800]" style={{ fontFamily: "var(--font-display)" }}>{carousel.title}</p>
              {carousel.slides.map((slide) => (
                <div key={slide.slide} className="p-3 rounded-[12px]" style={{ background: "rgba(0,0,0,0.1)", border: "0.5px solid var(--border)" }}>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Slide {slide.slide} &middot; <span className="uppercase">{slide.type}</span></span>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">{slide.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => copyText(carousel.slides.map(s => `Slide ${s.slide} [${s.type}]: ${s.content}`).join("\n\n"))} className="text-[10px] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Copiar todo</button>
                <button onClick={() => handleWriteCopy("carousel", carousel.title, carousel.slides[0].content, "carousel")} disabled={generatingCopy === "carousel"} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "var(--depth)", color: "var(--text-primary)" }}>{generatingCopy === "carousel" ? "..." : "IA \u2192"}</button>
              </div>
              {generatedCopies["carousel"] && <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.1)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line">{generatedCopies["carousel"]}</div>}
            </GlassCardNew>
          )}

          {/* Weekly Strategy */}
          {activeTab === "week" && weeklyStrategy && (
            <GlassCardNew intensity="subtle" className="p-5 space-y-3">
              <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">TEMA DE LA SEMANA</span>
              <p className="text-[14px] font-[800]" style={{ fontFamily: "var(--font-display)" }}>{weeklyStrategy.theme_of_week as string}</p>
              <div className="grid grid-cols-5 gap-1.5 mt-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => {
                  const plan = weeklyStrategy[day] as { format: string; topic: string } | null;
                  return (
                    <div key={day} className="p-2.5 rounded-lg text-center" style={{ background: plan ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.05)", border: "0.5px solid var(--border-ghost)" }}>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase">{day.slice(0, 3)}</p>
                      {plan ? (<>
                        <span className="text-[8px] font-mono mt-1 block" style={{ color: fmtColors[plan.format] || "var(--olive)" }}>{plan.format}</span>
                        <p className="text-[9px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{plan.topic}</p>
                      </>) : <p className="text-[9px] text-[var(--text-muted)] mt-1">&mdash;</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => handleApplyWeeklyPlan(weeklyStrategy as Record<string, { format: string; topic: string }>)} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "var(--depth)", color: "var(--text-primary)" }}>Aplicar al calendario</button>
            </GlassCardNew>
          )}

          {/* Repurpose */}
          {activeTab === "repurpose" && repurpose.length > 0 && (
            <div className="space-y-2">
              {repurpose.map((r, i) => (
                <GlassCardNew key={i} intensity="ghost" className="p-3.5">
                  <p className="text-[10px] text-[var(--text-muted)]">De: {r.from}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] font-medium mt-0.5">&rarr; {r.to}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{r.how}</p>
                </GlassCardNew>
              ))}
            </div>
          )}

          {/* Brand note */}
          {brandNote && (
            <GlassCardNew intensity="ghost" className="p-4">
              <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--depth)] mb-1 block">NOTA DE MARCA</span>
              <p className="text-[12px] text-[var(--text-secondary)] italic" style={{ fontFamily: "var(--font-serif)" }}>{brandNote}</p>
            </GlassCardNew>
          )}
        </>
      ) : (
        <GlassCardNew intensity="ghost" className="p-6 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">
            {a1.length > 0 || a2.length > 0 || a3.length > 0 ? "Completa las 3 preguntas (min. 20 caracteres) para generar tu briefing" : "Responde las 3 preguntas para generar tu briefing de contenido"}
          </p>
        </GlassCardNew>
      )}

      {/* ═══ ECOS ANTERIORES ═══ */}
      {history.length > 0 && (
        <>
          <div className="border-t pt-4 mt-2" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>ENTRADAS ANTERIORES</span>
          </div>
          <div className="space-y-2">
            {history.map((h, idx) => {
              const isExpanded = expandedHistoryId === h.id;
              const [hy, hm, hd] = h.entry_date.split("-").map(Number);
              const hDay = new Date(hy, hm - 1, hd).getDay();
              const hContent = h.generated_content as Record<string, unknown> | null;
              const hQuote = hContent?.quote_of_the_day as string | null;
              const hHooksCount = ((hContent?.hooks_bank || []) as unknown[]).length;
              const fadeOpacity = idx < 2 ? 1 : idx < 5 ? 0.8 : 0.6;
              const intensity = idx < 2 ? "subtle" as const : "ghost" as const;

              return (
                <GlassCardNew key={h.id} intensity={intensity} className="overflow-hidden" onClick={() => setExpandedHistoryId(isExpanded ? null : h.id)}>
                  <div className="px-4 py-3 flex items-center justify-between cursor-pointer" style={{ opacity: fadeOpacity }}>
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? <ChevronDown size={12} className="text-[var(--text-muted)]" /> : <ChevronRight size={12} className="text-[var(--text-muted)]" />}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dayColors[hDay] }} />
                      <span className="text-[11px] text-[var(--text-secondary)]">{formatHistoryDate(h.entry_date)}</span>
                      {h.mood && <span className="text-[11px]">{moodEmojis[h.mood] || ""}</span>}
                      {hHooksCount > 0 && <span className="text-[9px] text-[var(--text-muted)]">{hHooksCount} hooks</span>}
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: h.status === "completed" ? "rgba(168,183,142,0.12)" : "rgba(200,170,80,0.12)", color: h.status === "completed" ? "var(--olive)" : "var(--amber)" }}>
                      {h.status === "completed" ? "Completado" : "Sin completar"}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)] space-y-3">
                      {[
                        { q: h.question_1, a: h.answer_1, domain: getQuestionsForDay(hDay).questions[0].domain },
                        { q: h.question_2, a: h.answer_2, domain: getQuestionsForDay(hDay).questions[1].domain },
                        { q: h.question_3, a: h.answer_3, domain: getQuestionsForDay(hDay).questions[2].domain },
                      ].map((item, i) => (
                        <div key={i} style={{ borderLeft: `2px solid ${domainColors[item.domain] || "var(--border)"}`, paddingLeft: "12px" }}>
                          <span className="text-[8px] tracking-[0.15em] uppercase font-mono" style={{ color: domainColors[item.domain] || "var(--text-muted)" }}>{domainLabels[item.domain] || "REFLEXION"}</span>
                          <p className="text-[11px] italic text-[var(--text-muted)] mt-0.5">&ldquo;{item.q}&rdquo;</p>
                          {item.a ? <p className="text-[11px] text-[var(--text-secondary)] mt-1">{item.a}</p> : <p className="text-[9px] text-[var(--text-muted)] italic mt-1">Sin respuesta</p>}
                        </div>
                      ))}
                      {h.status === "completed" && hQuote && (
                        <div className="pt-2 border-t border-[var(--border-subtle)]">
                          <span className="text-[8px] text-[var(--amber)] font-mono uppercase">Frase:</span>
                          <p className="text-[11px] italic text-[var(--text-secondary)] mt-0.5" style={{ fontFamily: "var(--font-serif)" }}>&ldquo;{hQuote}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCardNew>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
