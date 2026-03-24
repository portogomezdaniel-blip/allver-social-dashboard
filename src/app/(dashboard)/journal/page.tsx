"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { type JournalEntry } from "@/lib/supabase/journal";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";
import { getTodayQuestions } from "@/lib/journal-questions";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const domainColors: Record<string, string> = { practice: "border-l-[var(--green)]", clients: "border-l-[var(--blue)]", philosophy: "border-l-[var(--purple)]" };
const domainTextColors: Record<string, string> = { practice: "text-[var(--green)]", clients: "text-[var(--blue)]", philosophy: "text-[var(--purple)]" };
const domainLabelKeys: Record<string, string> = { practice: "journal.your_practice", clients: "journal.your_clients", philosophy: "journal.philosophy" };
const moodEmojis: Record<string, string> = { reflective: "🪞", fired_up: "🔥", frustrated: "😤", grateful: "🙏", philosophical: "🌌", determined: "💪", vulnerable: "🫣" };
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fmtCls: Record<string, string> = { reel: "bg-[var(--purple-bg)] text-[var(--purple)]", carousel: "bg-[var(--blue-bg)] text-[var(--blue)]", single: "bg-[var(--amber-bg)] text-[var(--amber)]", story: "bg-[var(--green-bg)] text-[var(--green)]", story_series: "bg-[var(--green-bg)] text-[var(--green)]" };

function copyText(text: string) { navigator.clipboard.writeText(text); }

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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const todayQuestions = getTodayQuestions();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id; setUserId(uid);
      const { data: existing } = await supabase.from("journal_entries").select("*").eq("user_id", uid).eq("entry_date", today).single();
      if (existing) { setEntry(existing); setA1(existing.answer_1 || ""); setA2(existing.answer_2 || ""); setA3(existing.answer_3 || ""); }
      else {
        const { data: ne } = await supabase.from("journal_entries").upsert({ user_id: uid, entry_date: today, question_1: todayQuestions.questions[0].text, question_2: todayQuestions.questions[1].text, question_3: todayQuestions.questions[2].text, status: "pending" }, { onConflict: "user_id,entry_date" }).select().single();
        if (ne) setEntry(ne);
      }
      const { data: hist } = await supabase.from("journal_entries").select("*").eq("user_id", uid).neq("entry_date", today).order("entry_date", { ascending: false }).limit(10);
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
    if (!userId || !entry || a1.trim().length < 20) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agents/journal-analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, entryId: entry.id, question_1: entry.question_1, question_2: entry.question_2, question_3: entry.question_3, answer_1: a1, answer_2: a2, answer_3: a3 }) });
      const data = await res.json();
      if (data.content || data.briefing) {
        const briefing = data.briefing || data.content;
        setEntry({ ...entry, answer_1: a1, answer_2: a2, answer_3: a3, status: "completed", generated_content: data.content || briefing, mood: briefing.mood, themes: briefing.themes });
        fetch("/api/agents/extract-knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, journalEntryId: entry.id }) }).catch(() => {});
      }
    } catch (err) { console.error("Journal analyze error:", err); } setAnalyzing(false);
  }

  async function handleWriteCopy(key: string, tema: string, hook: string, formato: string) {
    if (!userId) return;
    setGeneratingCopy(key);
    try {
      const res = await fetch("/api/agents/write-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, tema, hook, formato }) });
      const data = await res.json();
      if (data.caption) setGeneratedCopies((p) => ({ ...p, [key]: data.caption }));
    } catch (err) { console.error("Journal copy error:", err); } setGeneratingCopy(null);
  }

  async function handleAddToCalendar(caption: string, format: string) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    await createPost({ caption, post_type: format as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: tomorrow.toISOString().split("T")[0], platform: "instagram" });
  }

  async function handleApplyWeeklyPlan(strategy: Record<string, { format: string; topic: string }>) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const startDate = new Date();
    const dayOfWeek = startDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysUntilMonday);

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const plan = strategy[day];
      if (!plan) continue;
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      await createPost({ caption: `[${plan.format.toUpperCase()}] ${plan.topic}`, post_type: (plan.format === "story_series" ? "story" : plan.format) as "reel" | "carousel" | "single" | "story", status: "scheduled", scheduled_date: date.toISOString().split("T")[0], platform: "instagram" });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">{t("journal.loading")}</div>;

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
  const engagement = b?.audience_engagement as { question_to_ask: string; poll_idea: { question: string; option_a: string; option_b: string }; comment_prompt: string } | null;
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
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">{t("journal.title")}</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {autoSaved && <span className="text-[10px] text-[var(--text-tertiary)] animate-pulse">{t("journal.saved")}</span>}
          <Link href="/journal/knowledge" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">{t("journal.knowledge_base")} →</Link>
        </div>
      </div>

      {/* Questions */}
      {!isCompleted && (
        <>
          {qItems.map((item, i) => (
            <Card key={i} className={`border-l-2 ${domainColors[item.domain] || ""}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)]">{i + 1}</span>
                  <p className={`text-[10px] uppercase tracking-[0.06em] font-medium ${domainTextColors[item.domain]}`}>{t(domainLabelKeys[item.domain])}</p>
                </div>
                <p className="text-[15px] font-medium italic mb-4">"{item.q}"</p>
                <Textarea value={item.a} onChange={(e) => item.set(e.target.value)} placeholder={t("journal.write_placeholder")} className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[100px]" />
                {item.a.length > 0 && item.a.length < 20 && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{20 - item.a.length} caracteres mas</p>}
              </CardContent>
            </Card>
          ))}
          <div className="flex flex-col items-center gap-2">
            <GlowButton variant="primary" onClick={handleSubmit} disabled={!canSubmit || analyzing} className="px-8">
              {analyzing ? <><Loader2 size={14} className="animate-spin mr-1" /> {t("journal.analyzing")}</> : `${t("journal.save_generate")} →`}
            </GlowButton>
            {!canSubmit && <p className="text-[10px] text-[var(--text-tertiary)]">{t("journal.min_required")}</p>}
          </div>
        </>
      )}

      {/* BRIEFING */}
      {isCompleted && (
        <>
          {/* Header */}
          <Card>
            <CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("journal.briefing_title")}</p>
                <div className="flex items-center gap-3 mt-1">
                  {entry?.mood && <span className="text-sm">{moodEmojis[entry.mood] || ""} {entry.mood}</span>}
                  {entry?.themes?.map((tag, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">#{tag}</span>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote */}
          {quote && (
            <Card className="border-l-2 border-l-[var(--amber)]">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-[18px] font-medium italic leading-relaxed max-w-lg mx-auto">"{quote}"</p>
                <div className="flex justify-center gap-3 mt-4">
                  <GlowButton onClick={() => copyText(quote)}>{t("journal.copy")}</GlowButton>
                  <GlowButton onClick={() => createPost({ caption: quote, post_type: "story", status: "draft", scheduled_date: null, platform: "instagram" })}>{t("journal.publish_story")}</GlowButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-[6px] transition-colors ${activeTab === tab.id ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Hero Post */}
          {activeTab === "hero" && hero && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">🎯</span>
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("journal.main_post")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${fmtCls[hero.format as string] || ""}`}>{(hero.format as string || "").toUpperCase()}</span>
                  <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{hero.best_time as string}</span>
                </div>
                <p className="text-[15px] font-medium">{hero.title as string}</p>
                <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-1">Hook</p>
                  <p className="text-[14px] font-medium italic">"{hero.hook as string}"</p>
                  <button onClick={() => copyText(hero.hook as string)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mt-1">{t("journal.copy_hook")}</button>
                </div>
                {(hero.outline as string[])?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-2">{t("journal.structure")}</p>
                    <ol className="space-y-1">{(hero.outline as string[]).map((p, i) => <li key={i} className="text-[12px] text-[var(--text-secondary)]">{i + 1}. {p}</li>)}</ol>
                  </div>
                )}
                <p className="text-[12px] text-[var(--text-secondary)]"><strong>CTA:</strong> {hero.cta as string}</p>
                <div className="flex flex-wrap gap-1">{(hero.hashtags as string[] || []).map((h, i) => <span key={i} className="text-[10px] text-[var(--text-tertiary)]">#{h}</span>)}</div>
                <div className="p-3 rounded-[6px] bg-[var(--green-bg)] border border-[var(--green)]/20">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--green)] font-medium mb-1">{t("journal.why_works")}</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">{hero.why as string}</p>
                </div>
                {generatedCopies["hero"] ? (
                  <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{generatedCopies["hero"]}</div>
                ) : null}
                <div className="flex gap-2">
                  <GlowButton variant="primary" onClick={() => handleWriteCopy("hero", hero.title as string, hero.hook as string, hero.format as string)} disabled={generatingCopy === "hero"}>
                    {generatingCopy === "hero" ? t("dashboard.generating") : `${t("journal.create_ai")} →`}
                  </GlowButton>
                  <GlowButton onClick={() => handleAddToCalendar(hero.hook as string, hero.format as string)}>
                    <CalendarIcon size={12} className="mr-1" /> {t("journal.add_calendar")}
                  </GlowButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secondary Posts */}
          {activeTab === "posts" && secondaryPosts.length > 0 && (
            <div className="space-y-3">
              {secondaryPosts.map((post, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${fmtCls[post.format as string] || ""}`}>{(post.format as string || "").toUpperCase()}</span>
                      <p className="text-[13px] font-medium">{post.title as string}</p>
                    </div>
                    <p className="text-[13px] italic text-[var(--text-secondary)]">"{post.hook as string}"</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{post.brief as string}</p>
                    <div className="flex gap-2">
                      <GlowButton variant="primary" onClick={() => handleWriteCopy(`sec-${i}`, post.title as string, post.hook as string, post.format as string)} disabled={generatingCopy === `sec-${i}`} className="text-[10px]">
                        {generatingCopy === `sec-${i}` ? "..." : t("journal.create_with_ai")}
                      </GlowButton>
                      <GlowButton onClick={() => handleAddToCalendar(post.hook as string, post.format as string)} className="text-[10px]">{t("journal.calendar")}</GlowButton>
                    </div>
                    {generatedCopies[`sec-${i}`] && <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line">{generatedCopies[`sec-${i}`]}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Hooks */}
          {activeTab === "hooks" && hooksBank.length > 0 && (
            <Card>
              <CardContent className="p-0 divide-y divide-[var(--border)]">
                {hooksBank.map((h, i) => (
                  <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-[14px] font-mono font-medium text-[var(--amber)] mt-0.5">{h.power_score}/10</span>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium">{h.text}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)]">{h.category}</span>
                          <button onClick={() => copyText(h.text)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">{t("journal.copy")}</button>
                          <button onClick={() => createHook({ text: h.text, source: "journal", category: h.category })} className="text-[10px] text-[var(--green)]">{t("journal.save_hook")}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stories */}
          {activeTab === "stories" && storyIdeas.length > 0 && (
            <div className="space-y-3">
              {storyIdeas.map((s, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-secondary)] uppercase">{s.type}</span>
                    </div>
                    <p className="text-[13px] font-medium">{s.content}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{t("journal.tactic")}: {s.engagement_tactic}</p>
                    <button onClick={() => copyText(s.content)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mt-2">{t("journal.copy")}</button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Carousel */}
          {activeTab === "carousel" && carousel && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-3">
                <p className="text-[14px] font-medium">{carousel.title}</p>
                {carousel.slides.map((slide) => (
                  <div key={slide.slide} className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Slide {slide.slide}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)] uppercase">{slide.type}</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)]">{slide.content}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <GlowButton onClick={() => copyText(carousel.slides.map((s) => `Slide ${s.slide} [${s.type}]: ${s.content}`).join("\n\n"))}>{t("journal.copy_all")}</GlowButton>
                  <GlowButton variant="primary" onClick={() => handleWriteCopy("carousel", carousel.title, carousel.slides[0].content, "carousel")} disabled={generatingCopy === "carousel"}>
                    {generatingCopy === "carousel" ? "..." : `${t("journal.create_with_ai")} →`}
                  </GlowButton>
                </div>
                {generatedCopies["carousel"] && <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line">{generatedCopies["carousel"]}</div>}
              </CardContent>
            </Card>
          )}

          {/* Weekly Strategy */}
          {activeTab === "week" && weeklyStrategy && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{t("journal.week_theme")}</p>
                <p className="text-[14px] font-medium">{weeklyStrategy.theme_of_week as string}</p>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => {
                    const plan = weeklyStrategy[day] as { format: string; topic: string } | null;
                    if (!plan) return <div key={day} className="p-3 rounded-[6px] border border-[var(--border)] text-center"><p className="text-[10px] text-[var(--text-tertiary)]">{day.slice(0, 3)}</p><p className="text-[10px] text-[var(--text-tertiary)]">—</p></div>;
                    return (
                      <div key={day} className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)]">
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase">{day.slice(0, 3)}</p>
                        <span className={`inline-flex mt-1 px-1 py-0.5 text-[8px] font-medium rounded-[2px] ${fmtCls[plan.format] || ""}`}>{plan.format}</span>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">{plan.topic}</p>
                      </div>
                    );
                  })}
                </div>
                <GlowButton variant="primary" onClick={() => handleApplyWeeklyPlan(weeklyStrategy as Record<string, { format: string; topic: string }>)}>
                  {t("journal.apply_calendar")}
                </GlowButton>
              </CardContent>
            </Card>
          )}

          {/* Repurpose */}
          {activeTab === "repurpose" && repurpose.length > 0 && (
            <div className="space-y-3">
              {repurpose.map((r, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[var(--text-tertiary)]">De:</span>
                      <span className="text-[11px] text-[var(--text-secondary)]">{r.from}</span>
                    </div>
                    <p className="text-[13px] font-medium">→ {r.to}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{r.how}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Engagement */}
          {engagement && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Engagement</p>
                {engagement.comment_prompt && (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[var(--text-secondary)]">{engagement.comment_prompt}</p>
                    <button onClick={() => copyText(engagement.comment_prompt)} className="text-[10px] text-[var(--text-tertiary)] shrink-0 ml-2">{t("journal.copy")}</button>
                  </div>
                )}
                {engagement.poll_idea && (
                  <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                    <p className="text-[11px] font-medium mb-1">{engagement.poll_idea.question}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">{engagement.poll_idea.option_a}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">{engagement.poll_idea.option_b}</span>
                    </div>
                  </div>
                )}
                {brandNote && (
                  <div className="p-3 rounded-[6px] border border-[var(--purple)]/20 bg-[var(--purple-bg)]">
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--purple)] font-medium mb-1">{t("journal.personal_brand")}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{brandNote}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Original answers */}
          <Card>
            <CardHeader><CardTitle className="text-[13px] text-[var(--text-tertiary)]">{t("journal.your_answers")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {qItems.map((item, i) => item.a && <div key={i}><p className="text-[10px] italic text-[var(--text-tertiary)]">"{item.q}"</p><p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{item.a}</p></div>)}
            </CardContent>
          </Card>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-medium">{t("journal.previous_entries")}</h2>
          {history.map((h) => (
            <Card key={h.id} className="cursor-pointer" onClick={() => setExpandedHistoryId(expandedHistoryId === h.id ? null : h.id)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{h.entry_date}</span>
                    {h.mood && <span>{moodEmojis[h.mood] || ""}</span>}
                    {h.themes?.slice(0, 3).map((tag, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)]">#{tag}</span>)}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-[3px] ${h.status === "completed" ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"}`}>
                    {h.status === "completed" ? t("journal.completed") : t("journal.incomplete")}
                  </span>
                </div>
                {expandedHistoryId === h.id && h.generated_content?.quote_of_the_day && (
                  <p className="text-[13px] italic text-[var(--text-secondary)] mt-3 pt-3 border-t border-[var(--border)]">"{h.generated_content.quote_of_the_day}"</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
