"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Copy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { Input } from "@/components/ui/input";
import { fetchHooks, createHook, toggleFavorite, type Hook } from "@/lib/supabase/hooks";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["all", "controversy", "question", "data", "story", "challenge"] as const;
const catLabels: Record<string, string> = {
  all: "Todos", controversy: "Controversia", question: "Pregunta",
  data: "Dato", story: "Historia", challenge: "Reto", variation: "Variacion",
};

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [variations, setVariations] = useState<Record<string, { hook: string; suggested_topic: string }[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newCat, setNewCat] = useState("controversy");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    fetchHooks().then(setHooks).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    filter === "all" ? hooks : hooks.filter((h) => h.category === filter),
    [hooks, filter]
  );

  async function handleGenerateVariations(hook: Hook) {
    if (!userId) return;
    setGenerating(hook.id);
    try {
      const res = await fetch("/api/agents/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hookText: hook.text, engagementScore: hook.engagement_score }),
      });
      const data = await res.json();
      if (data.variations) {
        setVariations((prev) => ({ ...prev, [hook.id]: data.variations }));
        const newHooks = await fetchHooks();
        setHooks(newHooks);
      }
    } catch {}
    setGenerating(null);
  }

  async function handleToggleFav(hook: Hook) {
    await toggleFavorite(hook.id, !hook.is_favorite);
    setHooks((prev) => prev.map((h) => h.id === hook.id ? { ...h, is_favorite: !h.is_favorite } : h));
  }

  async function handleSave() {
    if (!newText.trim()) return;
    const hook = await createHook({ text: newText, source: "saved", category: newCat });
    setHooks((prev) => [hook, ...prev]);
    setNewText("");
    setDialogOpen(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando hooks...</div>;

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Banco de Hooks</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">Tus mejores frases de apertura</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center rounded-[6px] border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-[7px] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-colors">
              + Guardar hook
            </DialogTrigger>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] sm:max-w-md">
              <DialogHeader><DialogTitle>Guardar hook</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Escribe el hook..." className="bg-[var(--bg)] border-[var(--border)] text-[13px]" />
                <Select value={newCat} onValueChange={(v) => { if (v) setNewCat(v); }}>
                  <SelectTrigger className="bg-[var(--bg)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                    {categories.filter((c) => c !== "all").map((c) => (
                      <SelectItem key={c} value={c}>{catLabels[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <GlowButton onClick={() => setDialogOpen(false)}>Cancelar</GlowButton>
                  <GlowButton variant="primary" onClick={handleSave} disabled={!newText.trim()}>Guardar</GlowButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-[6px] transition-colors ${
              filter === cat
                ? "bg-[var(--text-primary)] text-[var(--bg)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {catLabels[cat]}
          </button>
        ))}
      </div>

      {/* Hooks list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((hook) => (
                <div key={hook.id}>
                  <div className="px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggleFav(hook)} className="mt-0.5 shrink-0">
                        <Star size={14} className={hook.is_favorite ? "fill-[var(--amber)] text-[var(--amber)]" : "text-[var(--text-tertiary)]"} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium">{hook.text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {hook.category && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                              {catLabels[hook.category] || hook.category}
                            </span>
                          )}
                          {hook.engagement_score && (
                            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                              {hook.engagement_score} engagement
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--text-tertiary)]">
                            Usado {hook.times_used}x
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => navigator.clipboard.writeText(hook.text)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-[4px] transition-colors">
                          <Copy size={13} className="text-[var(--text-tertiary)]" />
                        </button>
                        <button
                          onClick={() => handleGenerateVariations(hook)}
                          disabled={generating === hook.id}
                          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-[4px] transition-colors disabled:opacity-50"
                        >
                          <Zap size={13} className={generating === hook.id ? "text-[var(--amber)] animate-pulse" : "text-[var(--text-tertiary)]"} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {variations[hook.id] && (
                    <div className="px-5 pb-4 pl-12 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Variaciones generadas</p>
                      {variations[hook.id].map((v, i) => (
                        <div key={i} className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                          <p className="text-[13px]">{v.hook}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Tema sugerido: {v.suggested_topic}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
              No hay hooks todavia. Guarda tu primer hook o genera nuevos con IA.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
