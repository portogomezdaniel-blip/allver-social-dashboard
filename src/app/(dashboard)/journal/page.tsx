"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { type JournalEntry } from "@/lib/supabase/journal";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";
import { getTodayQuestions } from "@/lib/journal-questions";
import Link from "next/link";

const domainColors: Record<string, string> = {
  practice: "border-l-[var(--green)]", clients: "border-l-[var(--blue)]", philosophy: "border-l-[var(--purple)]",
};
const domainTextColors: Record<string, string> = {
  practice: "text-[var(--green)]", clients: "text-[var(--blue)]", philosophy: "text-[var(--purple)]",
};
const domainLabels: Record<string, string> = { practice: "Tu Practica", clients: "Tus Clientes", philosophy: "Filosofia" };
const moodEmojis: Record<string, string> = { reflective: "🪞", fired_up: "🔥", frustrated: "😤", grateful: "🙏", philosophical: "🌌" };
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function JournalPage() {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
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
      const uid = data.user.id;
      setUserId(uid);

      const { data: existing } = await supabase.from("journal_entries").select("*").eq("user_id", uid).eq("entry_date", today).single();

      if (existing) {
        setEntry(existing);
        setA1(existing.answer_1 || "");
        setA2(existing.answer_2 || "");
        setA3(existing.answer_3 || "");
      } else {
        const { data: newEntry } = await supabase.from("journal_entries").upsert({
          user_id: uid, entry_date: today,
          question_1: todayQuestions.questions[0].text,
          question_2: todayQuestions.questions[1].text,
          question_3: todayQuestions.questions[2].text,
          status: "pending",
        }, { onConflict: "user_id,entry_date" }).select().single();
        if (newEntry) setEntry(newEntry);
      }

      const { data: hist } = await supabase.from("journal_entries").select("*").eq("user_id", uid).neq("entry_date", today).order("entry_date", { ascending: false }).limit(10);
      setHistory(hist ?? []);
      setLoading(false);
    });
  }, []);

  // Auto-save debounce 3s
  useEffect(() => {
    if (!userId || !entry || entry.status === "completed" || (!a1 && !a2 && !a3)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.from("journal_entries").update({ answer_1: a1 || null, answer_2: a2 || null, answer_3: a3 || null, status: "in_progress" }).eq("id", entry.id);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [a1, a2, a3, userId, entry]);

  async function handleSubmit() {
    if (!userId || !entry || a1.trim().length < 20) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agents/journal-analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, entryId: entry.id, question_1: entry.question_1, question_2: entry.question_2, question_3: entry.question_3, answer_1: a1, answer_2: a2, answer_3: a3 }),
      });
      const data = await res.json();
      if (data.content) {
        setEntry({ ...entry, answer_1: a1, answer_2: a2, answer_3: a3, status: "completed", generated_content: data.content, mood: data.content.mood, themes: data.content.themes });
        fetch("/api/agents/extract-knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, journalEntryId: entry.id }) }).catch(() => {});
      }
    } catch {}
    setAnalyzing(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando diario...</div>;

  const content = entry?.generated_content;
  const isCompleted = entry?.status === "completed" && content;
  const canSubmit = a1.trim().length >= 20 && a2.trim().length >= 20 && a3.trim().length >= 20;

  const qItems = [
    { q: entry?.question_1 || todayQuestions.questions[0].text, a: a1, set: setA1, domain: todayQuestions.questions[0].domain },
    { q: entry?.question_2 || todayQuestions.questions[1].text, a: a2, set: setA2, domain: todayQuestions.questions[1].domain },
    { q: entry?.question_3 || todayQuestions.questions[2].text, a: a3, set: setA3, domain: todayQuestions.questions[2].domain },
  ];

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Diario</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {autoSaved && <span className="text-[10px] text-[var(--text-tertiary)] animate-pulse">Guardado</span>}
          <Link href="/journal/knowledge" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Base de conocimiento →</Link>
        </div>
      </div>

      {!isCompleted && (
        <>
          {qItems.map((item, i) => (
            <Card key={i} className={`border-l-2 ${domainColors[item.domain] || ""}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)]">{i + 1}</span>
                  <p className={`text-[10px] uppercase tracking-[0.06em] font-medium ${domainTextColors[item.domain] || ""}`}>{domainLabels[item.domain]}</p>
                </div>
                <p className="text-[15px] font-medium italic mb-4">"{item.q}"</p>
                <Textarea value={item.a} onChange={(e) => item.set(e.target.value)} placeholder="Escribe lo que se te venga a la mente, sin filtro..." className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[100px]" />
                {item.a.length > 0 && item.a.length < 20 && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{20 - item.a.length} caracteres mas</p>}
              </CardContent>
            </Card>
          ))}
          <div className="flex flex-col items-center gap-2">
            <GlowButton variant="primary" onClick={handleSubmit} disabled={!canSubmit || analyzing} className="px-8">
              {analyzing ? <><Loader2 size={14} className="animate-spin mr-1" /> Analizando...</> : "Guardar y generar contenido →"}
            </GlowButton>
            {!canSubmit && <p className="text-[10px] text-[var(--text-tertiary)]">Responde las 3 preguntas (min. 20 caracteres)</p>}
          </div>
        </>
      )}

      {isCompleted && content && (
        <>
          {content.quote_of_the_day && (
            <Card className="border-l-2 border-l-[var(--amber)]">
              <CardContent className="pt-5 pb-5">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-2">Frase del dia</p>
                <p className="text-[17px] font-medium italic">"{content.quote_of_the_day}"</p>
                <div className="flex items-center gap-4 mt-3">
                  {entry.mood && <span className="text-[12px]">{moodEmojis[entry.mood] || ""} {entry.mood}</span>}
                  {entry.themes?.map((t, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">#{t}</span>)}
                  <button onClick={() => navigator.clipboard.writeText(content.quote_of_the_day!)} className="ml-auto"><Copy size={13} className="text-[var(--text-tertiary)]" /></button>
                </div>
              </CardContent>
            </Card>
          )}

          {content.hooks && content.hooks.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Hooks de tu reflexion</CardTitle></CardHeader>
              <CardContent className="p-0 divide-y divide-[var(--border)]">
                {content.hooks.map((h, i) => (
                  <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
                    <p className="text-[13px] font-medium">{h.text}</p>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => navigator.clipboard.writeText(h.text)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Copiar</button>
                      <button onClick={() => createHook({ text: h.text, source: "journal", category: h.category })} className="text-[10px] text-[var(--green)]">Guardar</button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {content.ideas && content.ideas.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Ideas de contenido</CardTitle></CardHeader>
              <CardContent className="p-0 divide-y divide-[var(--border)]">
                {content.ideas.map((idea, i) => (
                  <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${idea.format === "reel" ? "bg-[var(--purple-bg)] text-[var(--purple)]" : idea.format === "carousel" ? "bg-[var(--blue-bg)] text-[var(--blue)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"}`}>{idea.format.toUpperCase()}</span>
                      <p className="text-[13px] font-medium">{idea.title}</p>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">{idea.description}</p>
                    <button onClick={() => createPost({ caption: `${idea.title}\n\n${idea.description}`, post_type: idea.format as "reel" | "carousel" | "single", status: "draft", scheduled_date: null, platform: "instagram" })} className="text-[10px] text-[var(--green)] mt-2">Crear post →</button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-[13px] text-[var(--text-tertiary)]">Tus respuestas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {qItems.map((item, i) => item.a && (
                <div key={i}>
                  <p className="text-[10px] italic text-[var(--text-tertiary)]">"{item.q}"</p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{item.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-medium">Entradas anteriores</h2>
          {history.map((h) => (
            <Card key={h.id} className="cursor-pointer" onClick={() => setExpandedHistoryId(expandedHistoryId === h.id ? null : h.id)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{h.entry_date}</span>
                    {h.mood && <span>{moodEmojis[h.mood] || ""}</span>}
                    {h.themes?.slice(0, 3).map((t, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)]">#{t}</span>)}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-[3px] ${h.status === "completed" ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"}`}>
                    {h.status === "completed" ? "Completado" : "Sin completar"}
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
