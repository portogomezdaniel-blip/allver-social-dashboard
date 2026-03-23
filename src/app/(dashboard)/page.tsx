"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { GlowButton } from "@/components/ui/glow-button";
import { fetchTodaySuggestion, type DailySuggestion } from "@/lib/supabase/daily-suggestions";
import { fetchAgentRuns, type AgentRun } from "@/lib/supabase/agent-runs";
import { DbPost, fetchPosts } from "@/lib/supabase/posts";

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default function CommandCenter() {
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const now = new Date();
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });

    Promise.all([
      fetchTodaySuggestion().catch(() => null),
      fetchAgentRuns(5).catch(() => []),
      fetchPosts().catch(() => []),
    ]).then(([sug, agentRuns, allPosts]) => {
      setSuggestion(sug);
      setRuns(agentRuns);
      setPosts(allPosts);
      setLoading(false);
    });
  }, []);

  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "published") return false;
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const drafts = posts.filter((p) => p.status === "draft" || p.status === "backlog").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const recentPosts = posts.slice(0, 5);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/daily-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch {
      // silently fail
    }
    setGenerating(false);
  }

  async function handleWriteCopy() {
    if (!userId || !suggestion) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/write-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tema: suggestion.tema,
          hook: suggestion.hook,
          formato: suggestion.formato,
          puntasClave: suggestion.puntos_clave,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setSuggestion({ ...suggestion, generated_copy: data.caption, status: "accepted" });
      }
    } catch {
      // silently fail
    }
    setGenerating(false);
  }

  // Next 7 days
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayPost = posts.find((p) => p.scheduled_date === dateKey && p.status === "scheduled");
    return {
      day: dayNames[d.getDay()].slice(0, 3),
      date: d.getDate(),
      post: dayPost,
      isToday: i === 0,
    };
  });

  const statusLabels: Record<string, { label: string; cls: string }> = {
    published: { label: "Publicado", cls: "bg-[var(--green-bg)] text-[var(--green)]" },
    scheduled: { label: "Programado", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
    draft: { label: "Borrador", cls: "bg-[var(--bg-hover)] text-[var(--text-secondary)]" },
    backlog: { label: "Backlog", cls: "bg-[var(--bg-hover)] text-[var(--text-tertiary)]" },
  };

  const formatLabels: Record<string, { label: string; cls: string }> = {
    reel: { label: "REEL", cls: "bg-[var(--purple-bg)] text-[var(--purple)]" },
    carousel: { label: "CARRUSEL", cls: "bg-[var(--blue-bg)] text-[var(--blue)]" },
    single: { label: "SINGLE", cls: "bg-[var(--amber-bg)] text-[var(--amber)]" },
    story: { label: "STORY", cls: "bg-[var(--green-bg)] text-[var(--green)]" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">
        Cargando command center...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.03em]">Command Center</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{dateStr}</p>
        </div>
        <GlowButton variant="primary" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generando..." : "Generar contenido"}
        </GlowButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Posts este mes" value={publishedThisMonth} />
        <StatCard label="Programados" value={scheduled} />
        <StatCard label="Borradores" value={drafts} />
        <StatCard label="Total posts" value={posts.length} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Daily Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido del dia</CardTitle>
            <CardAction>
              <GlowButton variant="ghost" onClick={handleGenerate} disabled={generating} className="text-[11px]">
                Regenerar
              </GlowButton>
            </CardAction>
          </CardHeader>
          <CardContent>
            {suggestion ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${formatLabels[suggestion.formato]?.cls || "bg-[var(--bg-hover)] text-[var(--text-secondary)]"}`}>
                    {formatLabels[suggestion.formato]?.label || suggestion.formato}
                  </span>
                  {suggestion.hora_optima && (
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      {suggestion.hora_optima}
                    </span>
                  )}
                </div>
                <p className="text-[15px] font-medium tracking-[-0.01em]">{suggestion.tema}</p>
                <p className="text-[13px] italic text-[var(--text-secondary)]">"{suggestion.hook}"</p>
                {suggestion.hashtags && suggestion.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestion.hashtags.map((h, i) => (
                      <span key={i} className="text-[10px] text-[var(--text-tertiary)]">#{h}</span>
                    ))}
                  </div>
                )}
                {suggestion.generated_copy ? (
                  <div className="mt-3 p-3 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                    {suggestion.generated_copy}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <GlowButton variant="primary" onClick={handleWriteCopy} disabled={generating}>
                      Generar copy
                    </GlowButton>
                    <GlowButton>Editar</GlowButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[13px] text-[var(--text-tertiary)]">Sin sugerencia para hoy</p>
                <GlowButton variant="primary" className="mt-3" onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generando..." : "Generar ahora"}
                </GlowButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {runs.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {runs.map((run) => (
                  <div key={run.id} className="flex gap-3 px-5 py-3 items-start">
                    <span className={`mt-1.5 w-[7px] h-[7px] rounded-full shrink-0 ${run.status === "completed" ? "bg-[var(--green)]" : "bg-[var(--amber)]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)] font-medium">{run.agent_name}</strong>
                        {" — "}{run.input_summary}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
                        {formatRelative(run.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-5">
                <p className="text-[13px] text-[var(--text-tertiary)]">Sin actividad todavia</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Los agentes de IA registraran su actividad aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Content Pipeline</CardTitle>
          <CardAction>
            <Link href="/calendar" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Ver calendario →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {recentPosts.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--text-tertiary)] text-left py-2.5 px-5">Post</th>
                  <th className="text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--text-tertiary)] text-left py-2.5 px-5">Formato</th>
                  <th className="text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--text-tertiary)] text-left py-2.5 px-5">Status</th>
                  <th className="text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--text-tertiary)] text-right py-2.5 px-5">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => {
                  const st = statusLabels[post.status] || statusLabels.draft;
                  const fmt = formatLabels[post.post_type] || { label: post.post_type, cls: "" };
                  return (
                    <tr key={post.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-3 px-5 text-[12px] max-w-[280px] truncate">{post.caption}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${fmt.cls}`}>{fmt.label}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-[4px] ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-3 px-5 text-right text-[11px] font-mono text-[var(--text-tertiary)]">
                        {post.scheduled_date || post.created_at.split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-[13px] text-[var(--text-tertiary)]">
              No hay posts todavia. Crea tu primer post en Content.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next 7 days */}
      <Card>
        <CardHeader>
          <CardTitle>Proximos 7 dias</CardTitle>
          <CardAction>
            <Link href="/calendar" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Calendario completo →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {next7.map((d, i) => (
              <div
                key={i}
                className={`text-center p-3 rounded-[6px] border transition-colors ${
                  d.post
                    ? "border-[var(--border-focus)] bg-[var(--bg-hover)]"
                    : "border-[var(--border)] bg-transparent"
                } ${d.isToday ? "ring-1 ring-[var(--text-primary)]/20" : ""}`}
              >
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase">{d.day}</p>
                <p className="text-[14px] font-medium font-mono mt-0.5">{d.date}</p>
                {d.post ? (
                  <span className={`inline-flex mt-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] ${formatLabels[d.post.post_type]?.cls || ""}`}>
                    {formatLabels[d.post.post_type]?.label || d.post.post_type}
                  </span>
                ) : (
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">—</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-[18px_20px] transition-[border-color] duration-150 hover:border-[var(--border-focus)]"
      style={{ backgroundImage: "var(--satin)" }}
    >
      <p className="text-[11px] text-[var(--text-tertiary)] tracking-[0.02em] mb-2">{label}</p>
      <p className="text-[26px] font-medium tracking-[-0.03em] font-mono">{value}</p>
    </div>
  );
}
