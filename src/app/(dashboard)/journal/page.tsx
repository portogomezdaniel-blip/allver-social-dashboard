"use client";

import { useState, useEffect } from "react";
import { BookOpen, Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { fetchTodayEntry, fetchEntries, type JournalEntry } from "@/lib/supabase/journal";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";

const domainColors: Record<string, string> = {
  practice: "border-l-[var(--green)]", clients: "border-l-[var(--blue)]", philosophy: "border-l-[var(--purple)]",
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
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const now = new Date();
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });

    Promise.all([
      fetchTodayEntry().catch(() => null),
      fetchEntries(10).catch(() => []),
    ]).then(([e, h]) => {
      setEntry(e);
      if (e) { setA1(e.answer_1 || ""); setA2(e.answer_2 || ""); setA3(e.answer_3 || ""); }
      setHistory(h.filter((x) => x.id !== e?.id));
      setLoading(false);
    });
  }, []);

  async function handleGenerateQuestions() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/journal-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.entry) { setEntry(data.entry); setA1(""); setA2(""); setA3(""); }
    } catch {}
    setGenerating(false);
  }

  async function handleSubmit() {
    if (!userId || !entry || !a1.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agents/journal-analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, entryId: entry.id,
          question_1: entry.question_1, question_2: entry.question_2, question_3: entry.question_3,
          answer_1: a1, answer_2: a2, answer_3: a3,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setEntry({ ...entry, answer_1: a1, answer_2: a2, answer_3: a3, status: "completed", generated_content: data.content, mood: data.content.mood, themes: data.content.themes });
      }
    } catch {}
    setAnalyzing(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando diario...</div>;

  const content = entry?.generated_content;
  const isCompleted = entry?.status === "completed" && content;

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Diario</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{dateStr} · Tu reflexion diaria</p>
        </div>
      </div>

      {/* No entry yet */}
      {!entry && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen size={32} className="mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[15px] font-medium">Tu diario de hoy esta vacio</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1 mb-4">Genera 3 preguntas de reflexion para hoy</p>
            <GlowButton variant="primary" onClick={handleGenerateQuestions} disabled={generating}>
              {generating ? <><Loader2 size={14} className="animate-spin mr-1" /> Generando...</> : "Generar preguntas"}
            </GlowButton>
          </CardContent>
        </Card>
      )}

      {/* Questions (not completed) */}
      {entry && !isCompleted && (
        <>
          {[
            { q: entry.question_1, a: a1, set: setA1, domain: "practice" },
            { q: entry.question_2, a: a2, set: setA2, domain: "clients" },
            { q: entry.question_3, a: a3, set: setA3, domain: "philosophy" },
          ].map((item, i) => (
            <Card key={i} className={`border-l-2 ${domainColors[item.domain] || ""}`}>
              <CardContent className="pt-5 pb-5">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-2">
                  Pregunta {i + 1} · {domainLabels[item.domain] || item.domain}
                </p>
                <p className="text-[15px] font-medium italic mb-4">"{item.q}"</p>
                <Textarea
                  value={item.a}
                  onChange={(e) => item.set(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[100px]"
                />
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center">
            <GlowButton variant="primary" onClick={handleSubmit} disabled={!a1.trim() || analyzing} className="px-8">
              {analyzing ? <><Loader2 size={14} className="animate-spin mr-1" /> Analizando tu reflexion...</> : "Guardar y generar contenido →"}
            </GlowButton>
          </div>
        </>
      )}

      {/* Completed */}
      {isCompleted && content && (
        <>
          {/* Quote of the day */}
          {content.quote_of_the_day && (
            <Card className="border-l-2 border-l-[var(--amber)]">
              <CardContent className="pt-5 pb-5">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-2">Frase del dia</p>
                <p className="text-[17px] font-medium italic">"{content.quote_of_the_day}"</p>
                <div className="flex items-center gap-4 mt-3">
                  {entry.mood && <span className="text-[12px] text-[var(--text-tertiary)]">{moodEmojis[entry.mood] || ""} {entry.mood}</span>}
                  {entry.themes && entry.themes.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">#{t}</span>
                  ))}
                  <button onClick={() => navigator.clipboard.writeText(content.quote_of_the_day!)} className="ml-auto"><Copy size={13} className="text-[var(--text-tertiary)]" /></button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hooks */}
          {content.hooks && content.hooks.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Hooks nacidos de tu reflexion</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {content.hooks.map((h, i) => (
                    <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
                      <p className="text-[13px] font-medium">{h.text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-[var(--text-tertiary)]">Pregunta {h.source_question}</span>
                        <button onClick={() => navigator.clipboard.writeText(h.text)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Copiar</button>
                        <button onClick={() => createHook({ text: h.text, source: "journal", category: h.category })} className="text-[10px] text-[var(--green)]">Guardar hook</button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ideas */}
          {content.ideas && content.ideas.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Ideas de contenido</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {content.ideas.map((idea, i) => (
                    <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${
                          idea.format === "reel" ? "bg-[var(--purple-bg)] text-[var(--purple)]" :
                          idea.format === "carousel" ? "bg-[var(--blue-bg)] text-[var(--blue)]" :
                          "bg-[var(--amber-bg)] text-[var(--amber)]"
                        }`}>{idea.format.toUpperCase()}</span>
                        <p className="text-[13px] font-medium">{idea.title}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">{idea.description}</p>
                      <button onClick={() => createPost({ caption: `${idea.title}\n\n${idea.description}`, post_type: idea.format as "reel" | "carousel" | "single", status: "draft", scheduled_date: null, platform: "instagram" })} className="text-[10px] text-[var(--green)] mt-2">
                        Crear post →
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Original answers (collapsable) */}
          <Card>
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-[13px] text-[var(--text-tertiary)]">Tus respuestas de hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[{ q: entry.question_1, a: entry.answer_1 }, { q: entry.question_2, a: entry.answer_2 }, { q: entry.question_3, a: entry.answer_3 }].map((item, i) => (
                item.a && (
                  <div key={i}>
                    <p className="text-[11px] italic text-[var(--text-tertiary)]">"{item.q}"</p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">{item.a}</p>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-medium">Entradas anteriores</h2>
          {history.map((h) => (
            <Card key={h.id} className="cursor-pointer" onClick={() => setExpandedHistoryId(expandedHistoryId === h.id ? null : h.id)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{h.entry_date}</span>
                    {h.mood && <span className="text-base">{moodEmojis[h.mood] || ""}</span>}
                    {h.themes && h.themes.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)]">#{t}</span>
                    ))}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-[3px] ${h.status === "completed" ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"}`}>
                    {h.status === "completed" ? "Completado" : "Pendiente"}
                  </span>
                </div>
                {expandedHistoryId === h.id && h.generated_content?.quote_of_the_day && (
                  <p className="text-[13px] italic text-[var(--text-secondary)] mt-3 pt-3 border-t border-[var(--border)]">
                    "{h.generated_content.quote_of_the_day}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
