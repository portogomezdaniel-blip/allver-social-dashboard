"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { fetchSessions, type IdeaSession } from "@/lib/supabase/idea-sessions";
import { createHook } from "@/lib/supabase/hooks";
import { createPost } from "@/lib/supabase/posts";

const formatLabels: Record<string, { label: string; cls: string }> = {
  reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
  carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
  single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
  story: { label: "STORY", cls: "bg-[var(--green-bg)] text-[var(--green)]" },
};

export default function IdeasPage() {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ hooks: { text: string; category: string }[]; ideas: { title: string; format: string; description: string }[] } | null>(null);
  const [sessions, setSessions] = useState<IdeaSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
    fetchSessions(20).then(setSessions).catch((err) => console.error("Ideas load error:", err));
  }, []);

  async function handleGenerate() {
    if (!userId || !input.trim()) return;
    setGenerating(true);
    setCurrentResult(null);
    try {
      const res = await fetch("/api/agents/idea-generator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, input: input.trim() }),
      });
      const data = await res.json();
      if (data.hooks || data.ideas) {
        setCurrentResult({ hooks: data.hooks || [], ideas: data.ideas || [] });
        const refreshed = await fetchSessions(20);
        setSessions(refreshed);
      }
    } catch (err) { console.error("Idea generate error:", err); }
    setGenerating(false);
  }

  async function handleSaveHook(text: string, category: string) {
    try { await createHook({ text, source: "idea_session", category }); } catch (err) { console.error("Save hook error:", err); }
  }

  async function handleCreatePost(title: string, description: string, format: string) {
    try {
      await createPost({ caption: `${title}\n\n${description}`, post_type: format as "reel" | "carousel" | "single" | "story", status: "draft", scheduled_date: null, platform: "instagram" });
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.03em]">{t("ideas.title")}</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{t("ideas.subtitle")}</p>
      </div>

      {/* Idea Bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[var(--amber)]" />
            <p className="text-[14px] font-medium">Que tienes en mente hoy?</p>
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-3">Escribe una idea, algo que paso en el gym, o lo que quieras convertir en contenido</p>
          <div className="flex gap-2">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej: hoy un alumno me pregunto por que le duele la espalda al hacer peso muerto..." className="bg-[var(--bg)] border-[var(--border)] text-[14px] min-h-[44px] flex-1" rows={1} />
            <GlowButton variant="primary" onClick={handleGenerate} disabled={!input.trim() || generating} className="shrink-0 self-end">
              {generating ? <Loader2 size={14} className="animate-spin" /> : `${t("ideas.generate")} →`}
            </GlowButton>
          </div>
        </CardContent>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
              <Sparkles size={12} className="inline text-[var(--amber)] mr-1" />
              Ideas generadas a partir de: "{input.slice(0, 60)}..."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hooks */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-3">Hooks</p>
                <div className="space-y-2">
                  {currentResult.hooks.map((h, i) => (
                    <div key={i} className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-focus)] transition-colors">
                      <p className="text-[13px] font-medium">{h.text}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => navigator.clipboard.writeText(h.text)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Copiar</button>
                        <button onClick={() => handleSaveHook(h.text, h.category)} className="text-[10px] text-[var(--green)] hover:text-[var(--text-primary)] transition-colors">Guardar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Ideas */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-3">Contenido</p>
                <div className="space-y-2">
                  {currentResult.ideas.map((idea, i) => (
                    <div key={i} className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-focus)] transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${formatLabels[idea.format]?.cls || ""}`}>
                          {formatLabels[idea.format]?.label || idea.format}
                        </span>
                        <p className="text-[13px] font-medium">{idea.title}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">{idea.description}</p>
                      <button onClick={() => handleCreatePost(idea.title, idea.description, idea.format)} className="text-[10px] text-[var(--green)] hover:text-[var(--text-primary)] transition-colors mt-2">
                        Crear post →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-medium">{t("ideas.history")}</h2>
          {sessions.map((s) => (
            <Card key={s.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">"{s.input_text.slice(0, 80)}{s.input_text.length > 80 ? "..." : ""}"</p>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                      {new Date(s.created_at).toLocaleDateString("es")} · {s.generated_hooks.length} hooks · {s.generated_ideas.length} ideas
                    </p>
                  </div>
                  <Star size={14} className={s.is_favorite ? "fill-[var(--amber)] text-[var(--amber)]" : "text-[var(--text-tertiary)]"} />
                </div>
                {expandedId === s.id && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Hooks</p>
                      {s.generated_hooks.map((h, i) => (
                        <p key={i} className="text-[12px] text-[var(--text-secondary)]">· {h.text}</p>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Ideas</p>
                      {s.generated_ideas.map((idea, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`shrink-0 inline-flex items-center px-1 py-0.5 text-[8px] font-medium rounded-[2px] ${formatLabels[idea.format]?.cls || ""}`}>
                            {formatLabels[idea.format]?.label || idea.format}
                          </span>
                          <p className="text-[12px] text-[var(--text-secondary)]">{idea.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
