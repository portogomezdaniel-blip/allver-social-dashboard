"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { createClient } from "@/lib/supabase/client";
import { fetchNewsByDate, fetchTodayMeta, type DailyNews, type DailyNewsMeta } from "@/lib/supabase/daily-news";
import { createPost } from "@/lib/supabase/posts";

const urgencyConfig: Record<string, { label: string; cls: string; dot: string }> = {
  hot: { label: "HOT", cls: "bg-[var(--red-bg)] text-[var(--red)]", dot: "bg-[var(--red)]" },
  warm: { label: "WARM", cls: "bg-[var(--amber-bg)] text-[var(--amber)]", dot: "bg-[var(--amber)]" },
  evergreen: { label: "EVERGREEN", cls: "bg-[var(--green-bg)] text-[var(--green)]", dot: "bg-[var(--green)]" },
};

const catLabels: Record<string, string> = { industry: "Industria", science: "Ciencia", social_media: "Redes", business: "Negocio", trending: "Trending" };
const fmtCls: Record<string, string> = { reel: "bg-[var(--purple-bg)] text-[var(--purple)]", carousel: "bg-[var(--blue-bg)] text-[var(--blue)]", single: "bg-[var(--amber-bg)] text-[var(--amber)]", story: "bg-[var(--green-bg)] text-[var(--green)]" };

function copyText(t: string) { navigator.clipboard.writeText(t); }

export default function IntelPage() {
  const [news, setNews] = useState<DailyNews[]>([]);
  const [meta, setMeta] = useState<DailyNewsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [catFilter, setCatFilter] = useState("all");
  const [urgFilter, setUrgFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchNewsByDate(selectedDate),
      fetchTodayMeta().catch(() => null),
    ]).then(([n, m]) => { setNews(n); setMeta(m); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedDate]);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    try {
      await fetch("/api/agents/daily-news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const refreshed = await fetchNewsByDate(selectedDate);
      const refreshedMeta = await fetchTodayMeta().catch(() => null);
      setNews(refreshed);
      setMeta(refreshedMeta);
    } catch {}
    setGenerating(false);
  }

  async function handleCreatePost(hook: string, format: string) {
    await createPost({ caption: hook, post_type: (format || "single") as "reel" | "carousel" | "single" | "story", status: "draft", scheduled_date: null, platform: "instagram" });
  }

  const filtered = news.filter((n) => {
    if (catFilter !== "all" && n.category !== catFilter) return false;
    if (urgFilter !== "all" && n.urgency !== urgFilter) return false;
    return true;
  });

  const sources = [...new Set(news.map((n) => n.source).filter(Boolean))];
  const hotCount = news.filter((n) => n.urgency === "hot").length;
  const warmCount = news.filter((n) => n.urgency === "warm").length;
  const evergreenCount = news.filter((n) => n.urgency === "evergreen").length;

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Intel</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">Noticias reales de tu industria</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[6px] px-3 py-1.5 text-[12px] text-[var(--text-primary)] font-mono" />
          <GlowButton variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 size={14} className="animate-spin mr-1" />Buscando...</> : "Actualizar noticias"}
          </GlowButton>
        </div>
      </div>

      {/* Status bar */}
      {news.length > 0 && (
        <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)] p-3 rounded-[6px] bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[var(--green)]">{news.length} noticias</span>
          {hotCount > 0 && <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--red)] mr-1" />{hotCount} HOT</span>}
          {warmCount > 0 && <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--amber)] mr-1" />{warmCount} WARM</span>}
          {evergreenCount > 0 && <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--green)] mr-1" />{evergreenCount} EVERGREEN</span>}
          <span className="ml-auto">Fuentes: {sources.slice(0, 5).join(", ")}{sources.length > 5 ? ` +${sources.length - 5}` : ""}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-1">
          {["all", "industry", "science", "social_media", "business", "trending"].map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)} className={`px-2.5 py-1 text-[10px] font-medium rounded-[6px] transition-colors ${catFilter === cat ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
              {cat === "all" ? "Todas" : catLabels[cat] || cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "hot", "warm", "evergreen"].map((urg) => (
            <button key={urg} onClick={() => setUrgFilter(urg)} className={`px-2.5 py-1 text-[10px] font-medium rounded-[6px] transition-colors ${urgFilter === urg ? "bg-[var(--text-primary)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
              {urg === "all" ? "Todas" : urgencyConfig[urg]?.label || urg}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">Cargando intel...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const urg = urgencyConfig[item.urgency || "warm"] || urgencyConfig.warm;
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 mt-1 w-2 h-2 rounded-full ${urg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${urg.cls}`}>{urg.label}</span>
                        {item.category && <span className="text-[10px] text-[var(--text-tertiary)]">{catLabels[item.category] || item.category}</span>}
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] ml-auto">{item.source}</span>
                      </div>
                      <p className="text-[14px] font-medium">{item.title}</p>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1">{item.summary}</p>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {item.unique_angle && (
                            <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                              <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-1">Tu angulo</p>
                              <p className="text-[12px] text-[var(--text-secondary)]">{item.unique_angle}</p>
                            </div>
                          )}
                          <div className="p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)]">
                            <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium mb-1">Hook sugerido</p>
                            <p className="text-[13px] italic font-medium">"{item.suggested_hook}"</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.suggested_format && <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${fmtCls[item.suggested_format] || ""}`}>{(item.suggested_format || "").toUpperCase()}</span>}
                            {item.content_idea && <span className="text-[11px] text-[var(--text-tertiary)]">{item.content_idea}</span>}
                          </div>
                          <div className="flex gap-2">
                            <GlowButton variant="primary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCreatePost(item.suggested_hook, item.suggested_format || "single"); }}>Crear post →</GlowButton>
                            <GlowButton onClick={(e: React.MouseEvent) => { e.stopPropagation(); copyText(item.suggested_hook); }}>Copiar hook</GlowButton>
                            {item.source_url && <a href={item.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 px-3 py-[7px] text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><ExternalLink size={12} />Fuente</a>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[13px] text-[var(--text-tertiary)]">No hay noticias para esta fecha</p>
            <GlowButton variant="primary" className="mt-3" onClick={handleGenerate} disabled={generating}>
              {generating ? "Buscando..." : "Buscar noticias"}
            </GlowButton>
          </CardContent>
        </Card>
      )}

      {/* Connections */}
      {meta?.connections && meta.connections.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Conexiones entre noticias</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y divide-[var(--border)]">
            {meta.connections.map((conn, i) => (
              <div key={i} className="px-5 py-3.5">
                <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Noticias {conn.news_indices.map((n) => n + 1).join(" + ")}</p>
                <p className="text-[13px] font-medium">{conn.combined_idea}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${fmtCls[conn.format] || ""}`}>{conn.format.toUpperCase()}</span>
                  <p className="text-[12px] italic text-[var(--text-secondary)]">"{conn.hook}"</p>
                </div>
                <GlowButton variant="primary" className="mt-2" onClick={() => handleCreatePost(conn.hook, conn.format)}>Crear con IA →</GlowButton>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Thread */}
      {meta?.thread_idea && (
        <Card>
          <CardHeader><CardTitle>Hilo sugerido para hoy</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[14px] font-medium mb-3">{meta.thread_idea.title}</p>
            <div className="space-y-2">
              {meta.thread_idea.posts.map((post, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 mt-0.5">{i + 1}/{meta.thread_idea!.posts.length}</span>
                  <p className="text-[12px] text-[var(--text-secondary)]">{post}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <GlowButton onClick={() => copyText(meta.thread_idea!.posts.join("\n\n"))}>Copiar hilo</GlowButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
