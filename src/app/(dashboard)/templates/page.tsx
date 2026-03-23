"use client";

import { useState, useEffect } from "react";
import { LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchTemplates, type ContentTemplate } from "@/lib/supabase/templates";
import { createClient } from "@/lib/supabase/client";

const formatLabels: Record<string, { label: string; cls: string }> = {
  reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
  carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
  single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
};

const catLabels: Record<string, string> = {
  educational: "Educativo", social_proof: "Prueba social",
  engagement: "Engagement", authority: "Autoridad",
};

const freqLabels: Record<string, string> = {
  "1x_week": "1x/semana", "2x_week": "2-3x/semana", "1x_month": "1-2x/mes",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    fetchTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleFillWithAI(template: ContentTemplate) {
    if (!userId) return;
    setGenerating(template.id);
    const tema = prompt("Sobre que tema quieres llenar este template?");
    if (!tema) { setGenerating(null); return; }

    try {
      const res = await fetch("/api/agents/write-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tema,
          formato: template.format,
          templateStructure: template.structure,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setGeneratedCopy((prev) => ({ ...prev, [template.id]: data.caption }));
      }
    } catch {}
    setGenerating(null);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">Cargando templates...</div>;

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.03em]">Templates</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">Estructuras de copy para tu nicho</p>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                    <LayoutTemplate size={16} className="text-[var(--text-tertiary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{t.name}</p>
                    {t.description && (
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{t.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {formatLabels[t.format] && (
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${formatLabels[t.format].cls}`}>
                      {formatLabels[t.format].label}
                    </span>
                  )}
                  {t.category && catLabels[t.category] && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      {catLabels[t.category]}
                    </span>
                  )}
                  {t.suggested_frequency && freqLabels[t.suggested_frequency] && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {freqLabels[t.suggested_frequency]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] mb-3">
                  <span>Usado {t.times_used}x</span>
                  {t.avg_engagement && <span>Engagement avg: {t.avg_engagement}</span>}
                </div>

                {generatedCopy[t.id] ? (
                  <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed mb-3">
                    {generatedCopy[t.id]}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <GlowButton variant="primary" onClick={() => handleFillWithAI(t)} disabled={generating === t.id}>
                    {generating === t.id ? "Generando..." : "Llenar con IA"}
                  </GlowButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <LayoutTemplate size={32} className="mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] text-[var(--text-tertiary)]">No hay templates todavia</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Los templates se crearan cuando configures tu identidad de creador</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
