"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchKnowledge, fetchKnowledgeStats, deactivateFragment, type KnowledgeFragment } from "@/lib/supabase/knowledge";
import { createClient } from "@/lib/supabase/client";
import { Brain, X } from "lucide-react";

const categoryColors: Record<string, string> = {
  belief: "bg-[var(--purple-bg)] text-[var(--purple)]",
  story: "bg-[var(--blue-bg)] text-[var(--blue)]",
  frustration: "bg-[var(--red-bg)] text-[var(--red)]",
  principle: "bg-[var(--green-bg)] text-[var(--green)]",
  client_pattern: "bg-[var(--blue-bg)] text-[var(--blue)]",
  vulnerability: "bg-[var(--amber-bg)] text-[var(--amber)]",
  passion: "bg-[var(--green-bg)] text-[var(--green)]",
  controversy: "bg-[var(--red-bg)] text-[var(--red)]",
  method: "bg-[var(--green-bg)] text-[var(--green)]",
  origin: "bg-[var(--purple-bg)] text-[var(--purple)]",
  vocabulary: "bg-[var(--amber-bg)] text-[var(--amber)]",
  audience_insight: "bg-[var(--blue-bg)] text-[var(--blue)]",
};

const categoryLabels: Record<string, string> = {
  belief: "Creencia", story: "Historia", frustration: "Frustracion", principle: "Principio",
  client_pattern: "Patron", vulnerability: "Vulnerabilidad", passion: "Pasion",
  controversy: "Controversia", method: "Metodo", origin: "Origen",
  vocabulary: "Vocabulario", audience_insight: "Audiencia",
};

const categories = ["all", "belief", "story", "frustration", "principle", "client_pattern", "passion", "controversy", "method", "vocabulary", "audience_insight"];

export default function KnowledgePage() {
  const [fragments, setFragments] = useState<KnowledgeFragment[]>([]);
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number>; unusedHighPotential: number }>({ total: 0, byCategory: {}, unusedHighPotential: 0 });
  const [filter, setFilter] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
    Promise.all([
      fetchKnowledge({ limit: 100 }),
      fetchKnowledgeStats(),
    ]).then(([f, s]) => {
      setFragments(f);
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? fragments : fragments.filter((f) => f.category === filter);

  async function handleDeactivate(id: string) {
    await deactivateFragment(id);
    setFragments((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleEvolve() {
    if (!userId) return;
    setEvolving(true);
    try {
      await fetch("/api/agents/evolve-identity", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    setEvolving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando base de conocimiento...</div>;

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Base de Conocimiento</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">Todo lo que el sistema sabe de ti, extraido de tus reflexiones</p>
        </div>
        <GlowButton variant="primary" onClick={handleEvolve} disabled={evolving || stats.total === 0}>
          <Brain size={14} className="mr-1" />
          {evolving ? "Evolucionando..." : "Regenerar identidad"}
        </GlowButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center" style={{ backgroundImage: "var(--satin)" }}>
          <p className="text-[24px] font-medium font-mono">{stats.total}</p>
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Fragmentos</p>
        </div>
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center" style={{ backgroundImage: "var(--satin)" }}>
          <p className="text-[24px] font-medium font-mono">{Object.keys(stats.byCategory).length}</p>
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Categorias</p>
        </div>
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center" style={{ backgroundImage: "var(--satin)" }}>
          <p className="text-[24px] font-medium font-mono text-[var(--green)]">{stats.unusedHighPotential}</p>
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Ideas sin usar</p>
        </div>
      </div>

      {/* Category distribution */}
      {Object.keys(stats.byCategory).length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1.5">
              {Object.entries(stats.byCategory).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] w-20 justify-center ${categoryColors[cat] || ""}`}>
                    {categoryLabels[cat] || cat}
                  </span>
                  <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: `${(count / stats.total) * 100}%`, opacity: 0.5 }} />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-tertiary)] w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-[10px] font-medium rounded-[6px] transition-colors ${filter === cat ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
            {cat === "all" ? "Todos" : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Fragments */}
      <div className="space-y-2">
        {filtered.map((f) => (
          <Card key={f.id}>
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${categoryColors[f.category] || ""}`}>
                {categoryLabels[f.category] || f.category}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px]">{f.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  {f.emotional_weight && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {"●".repeat(f.emotional_weight === "high" ? 3 : f.emotional_weight === "medium" ? 2 : 1)}
                      {"○".repeat(f.emotional_weight === "high" ? 0 : f.emotional_weight === "medium" ? 1 : 2)}
                    </span>
                  )}
                  {f.content_potential && (
                    <span className={`text-[10px] ${f.content_potential === "high" ? "text-[var(--green)]" : "text-[var(--text-tertiary)]"}`}>
                      Potencial: {f.content_potential}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Usado {f.times_referenced}x
                  </span>
                  {f.source_date && (
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{f.source_date}</span>
                  )}
                </div>
                {f.tags && f.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {f.tags.map((t, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-hover)] text-[var(--text-tertiary)]">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => handleDeactivate(f.id)} className="shrink-0 p-1 hover:bg-[var(--bg-hover)] rounded-[4px] transition-colors">
                <X size={12} className="text-[var(--text-tertiary)]" />
              </button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[13px] text-[var(--text-tertiary)]">
            {stats.total === 0 ? "Sin fragmentos todavia. Responde el diario para empezar." : "Sin fragmentos en esta categoria."}
          </div>
        )}
      </div>
    </div>
  );
}
