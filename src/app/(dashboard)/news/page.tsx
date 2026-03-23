"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Loader2, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { createClient } from "@/lib/supabase/client";
import { fetchNewsByDate, type DailyNews } from "@/lib/supabase/daily-news";
import { createPost } from "@/lib/supabase/posts";

const urgencyConfig: Record<string, { label: string; sublabel: string; emoji: string; cls: string; dot: string }> = {
  hot: { label: "HOT", sublabel: "Publicar hoy", emoji: "🔴", cls: "bg-[var(--red-bg)] text-[var(--red)]", dot: "bg-[var(--red)]" },
  warm: { label: "WARM", sublabel: "Esta semana", emoji: "🟡", cls: "bg-[var(--amber-bg)] text-[var(--amber)]", dot: "bg-[var(--amber)]" },
  evergreen: { label: "EVERGREEN", sublabel: "Cuando quiera", emoji: "🟢", cls: "bg-[var(--green-bg)] text-[var(--green)]", dot: "bg-[var(--green)]" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function IntelPage() {
  const [news, setNews] = useState<DailyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const loadNews = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const n = await fetchNewsByDate(date);
      setNews(n);
    } catch {
      setNews([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews(selectedDate);
  }, [selectedDate, loadNews]);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    try {
      await fetch("/api/agents/daily-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await loadNews(selectedDate);
    } catch {}
    setGenerating(false);
  }

  async function handleCreatePost(item: DailyNews) {
    await createPost({
      caption: item.suggested_hook,
      post_type: (item.suggested_format || "single") as "reel" | "carousel" | "single" | "story",
      status: "draft",
      scheduled_date: null,
      platform: "instagram",
    });
    showToast("Post creado como borrador");
  }

  function handleCopyHook(item: DailyNews) {
    navigator.clipboard.writeText(item.suggested_hook);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Hook copiado");
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Intel</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">3 noticias diarias de tu nicho</p>
        </div>
        <GlowButton variant="primary" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1.5" />
              Buscando...
            </>
          ) : (
            "Actualizar"
          )}
        </GlowButton>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
          className="p-1.5 rounded-[6px] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[14px] font-medium font-mono min-w-[140px] text-center">
          {isToday ? "Hoy" : formatDate(selectedDate)}
        </span>
        <button
          onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
          className="p-1.5 rounded-[6px] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
          disabled={isToday}
        >
          <ChevronRight size={18} className={isToday ? "opacity-30" : ""} />
        </button>
      </div>

      {/* News cards */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">Cargando intel...</div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => {
            const urg = urgencyConfig[item.urgency || "warm"] || urgencyConfig.warm;
            return (
              <Card key={item.id}>
                <CardContent className="pt-5 pb-5">
                  {/* Urgency header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${urg.cls}`}>
                        {urg.emoji} {urg.label} · {urg.sublabel}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      {item.source} · {formatDate(item.news_date)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-medium leading-snug mb-2">{item.title}</h3>

                  {/* Summary */}
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
                    {item.summary}
                  </p>

                  {/* Hook */}
                  <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] mb-4">
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-1.5">
                      HOOK
                    </p>
                    <p className="text-[14px] italic font-medium leading-snug">
                      &ldquo;{item.suggested_hook}&rdquo;
                    </p>
                  </div>

                  {/* Format */}
                  <p className="text-[11px] text-[var(--text-tertiary)] mb-4">
                    Formato: <span className="uppercase font-medium text-[var(--text-secondary)]">{item.suggested_format || "single"}</span>
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <GlowButton
                      variant="primary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleCreatePost(item);
                      }}
                    >
                      Crear post →
                    </GlowButton>
                    <GlowButton
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleCopyHook(item);
                      }}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check size={12} className="mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="mr-1" />
                          Copiar hook
                        </>
                      )}
                    </GlowButton>
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-[7px] text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <ExternalLink size={12} />
                        Ver fuente
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-[15px] text-[var(--text-tertiary)] mb-1">Sin noticias para {isToday ? "hoy" : formatDate(selectedDate)}</p>
            {isToday && (
              <GlowButton variant="primary" className="mt-4" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    Generando noticias...
                  </>
                ) : (
                  "Generar noticias"
                )}
              </GlowButton>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2.5 rounded-[8px] text-[13px] font-medium shadow-lg animate-in slide-in-from-bottom-2 z-50">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
