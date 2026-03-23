"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchTodayNews, fetchNewsByDate, type DailyNews } from "@/lib/supabase/daily-news";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/lib/supabase/posts";

const formatLabels: Record<string, { label: string; cls: string }> = {
  reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
  carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
  single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
};

export default function IntelPage() {
  const [news, setNews] = useState<DailyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNewsByDate(selectedDate).then(setNews).catch(() => setNews([])).finally(() => setLoading(false));
  }, [selectedDate]);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/daily-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.news) {
        const refreshed = await fetchTodayNews();
        setNews(refreshed);
      }
    } catch {}
    setGenerating(false);
  }

  async function handleUseAsPost(item: DailyNews) {
    try {
      await createPost({
        caption: `${item.suggested_hook}\n\n${item.summary}`,
        post_type: (item.suggested_format as "reel" | "carousel" | "single") || "single",
        status: "draft",
        scheduled_date: null,
        platform: "instagram",
      });
      setNews((prev) => prev.map((n) => n.id === item.id ? { ...n, used_as_post: true } : n));
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Intel</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">5 ideas de contenido basadas en lo que pasa hoy</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[6px] px-3 py-1.5 text-[12px] text-[var(--text-primary)] font-mono"
          />
          <GlowButton variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generando..." : "Regenerar"}
          </GlowButton>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">Cargando intel...</div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium tracking-[-0.01em]">{item.title}</p>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                      {item.source} · {item.news_date}
                    </p>
                  </div>
                  {item.suggested_format && formatLabels[item.suggested_format] && (
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${formatLabels[item.suggested_format].cls}`}>
                      {formatLabels[item.suggested_format].label}
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-[var(--text-secondary)] mt-3 leading-relaxed">{item.summary}</p>

                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-1.5">Hook sugerido</p>
                  <p className="text-[14px] italic text-[var(--text-secondary)]">"{item.suggested_hook}"</p>
                </div>

                <div className="flex gap-2 mt-4">
                  {item.used_as_post ? (
                    <span className="text-[11px] text-[var(--green)]">Agregado a borradores</span>
                  ) : (
                    <GlowButton variant="primary" onClick={() => handleUseAsPost(item)}>
                      Usar como post
                    </GlowButton>
                  )}
                  <GlowButton onClick={() => navigator.clipboard.writeText(item.suggested_hook)}>
                    Copiar hook
                  </GlowButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[13px] text-[var(--text-tertiary)]">No hay intel para esta fecha</p>
            <GlowButton variant="primary" className="mt-3" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generando..." : "Generar intel"}
            </GlowButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
