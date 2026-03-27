"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import { fetchAgentRuns } from "@/lib/supabase/agent-runs";
import type { AgentRun } from "@/lib/supabase/agent-runs";
import GlassCardNew from "@/components/ui/GlassCardNew";

// ─── Agent definitions ─────────────────────────────────────
interface AgentDef {
  id: string;
  name: string;
  dbNames: string[];
  description: string;
  status: "online" | "building";
}

const AGENTS: AgentDef[] = [
  { id: "content-engine", name: "Content Engine", dbNames: ["idea-generator", "daily-content", "write-copy"], description: "Genera 4 angulos de contenido a partir de tu journal, ideas, e intel.", status: "online" },
  { id: "program-architect", name: "Program Architect", dbNames: ["program-architect"], description: "Disena programas de entrenamiento personalizados para tus clientes.", status: "online" },
  { id: "intel-scanner", name: "Intel Scanner", dbNames: ["daily-news"], description: "3 noticias diarias del nicho. HOT / WARM / EVERGREEN con hooks listos.", status: "online" },
  { id: "journal-analyzer", name: "Journal Analyzer", dbNames: ["journal-analyze", "extract-knowledge"], description: "Analiza tu journal y genera briefing completo con hooks y plan semanal.", status: "online" },
  { id: "setter", name: "Setter", dbNames: ["setter"], description: "Agente de ventas. Responde DMs, califica leads, agenda llamadas.", status: "building" },
  { id: "radar-brain", name: "RADAR Brain", dbNames: ["radar"], description: "Metricas, patrones, cuellos de botella, reportes y SOPs automaticos.", status: "building" },
  { id: "email-agent", name: "Email Agent", dbNames: ["email"], description: "Newsletters semanales cruzando contenido con tu knowledge base.", status: "building" },
  { id: "loom-generator", name: "Loom Generator", dbNames: ["loom"], description: "Guiones para videos Loom de venta.", status: "building" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toLocaleDateString("en-CA") === new Date().toLocaleDateString("en-CA");
}

// ─── Main Component ────────────────────────────────────────
export default function AgentsPage() {
  const { t } = useLocale();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentRuns(100)
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  // Compute stats per agent
  const agentStats = useMemo(() => {
    const stats: Record<string, { total: number; today: number; avgMs: number }> = {};
    for (const run of runs) {
      if (!stats[run.agent_name]) stats[run.agent_name] = { total: 0, today: 0, avgMs: 0 };
      stats[run.agent_name].total++;
      if (isToday(run.created_at)) stats[run.agent_name].today++;
    }
    // Compute avg duration
    for (const name of Object.keys(stats)) {
      const agentRuns = runs.filter((r) => r.agent_name === name && r.duration_ms);
      if (agentRuns.length > 0) {
        stats[name].avgMs = Math.round(agentRuns.reduce((s, r) => s + (r.duration_ms || 0), 0) / agentRuns.length);
      }
    }
    return stats;
  }, [runs]);

  function getAgentTotal(agent: AgentDef): number {
    return agent.dbNames.reduce((sum, name) => sum + (agentStats[name]?.total || 0), 0);
  }
  function getAgentToday(agent: AgentDef): number {
    return agent.dbNames.reduce((sum, name) => sum + (agentStats[name]?.today || 0), 0);
  }

  const activeAgents = AGENTS.filter((a) => a.status === "online");
  const buildingAgents = AGENTS.filter((a) => a.status === "building");
  const recentRuns = runs.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px]" style={{ fontFamily: "var(--font-display)" }}>
          {t("agents.title")}
        </h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
          Tu equipo de IA. Cada agente tiene una funcion especifica.
        </p>
      </div>

      {/* ACTIVOS */}
      <div>
        <p
          className="mb-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-ghost)" }}
        >
          ACTIVOS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeAgents.map((agent) => {
            const total = getAgentTotal(agent);
            const today = getAgentToday(agent);

            return (
              <GlassCardNew key={agent.id} intensity="strong" className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 12 }}>
                    {agent.name}
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-[8px] px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "var(--font-mono)", background: "var(--olive-bg)", color: "var(--olive)" }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full bg-[var(--olive)]" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
                    Online
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] leading-[1.4] mb-3" style={{ color: "var(--text-secondary)" }}>
                  {agent.description}
                </p>

                {/* Stats */}
                <div
                  className="flex items-center gap-4 pt-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--text-primary)" }}>
                      {total}
                    </span>
                    <span className="ml-1 text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      total
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--text-primary)" }}>
                      {today}
                    </span>
                    <span className="ml-1 text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      hoy
                    </span>
                  </div>
                </div>
              </GlassCardNew>
            );
          })}
        </div>
      </div>

      {/* EN CONSTRUCCIÓN */}
      <div>
        <p
          className="mb-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-ghost)" }}
        >
          EN CONSTRUCCION
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
          {buildingAgents.map((agent) => (
            <GlassCardNew key={agent.id} intensity="subtle" hover={false} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontFamily: "var(--font-display)", fontSize: 12 }}>
                  {agent.name}
                </span>
                <span
                  className="flex items-center gap-1.5 text-[8px] px-2 py-0.5 rounded-full"
                  style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}
                >
                  <span className="w-[5px] h-[5px] rounded-full bg-[var(--red)]" style={{ animation: "pulse-dot 3s ease-in-out infinite" }} />
                  Building
                </span>
              </div>
              <p className="text-[11px] leading-[1.4]" style={{ color: "var(--text-muted)" }}>
                {agent.description}
              </p>
            </GlassCardNew>
          ))}
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div>
        <p
          className="mb-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-ghost)" }}
        >
          ACTIVIDAD RECIENTE
        </p>

        {loading ? (
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Cargando...</p>
        ) : recentRuns.length === 0 ? (
          <p className="text-[12px]" style={{ color: "var(--text-ghost)" }}>Sin actividad reciente</p>
        ) : (
          <div className="space-y-1">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <span
                  className="text-[8px] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ fontFamily: "var(--font-mono)", background: "var(--olive-bg)", color: "var(--olive)" }}
                >
                  {run.agent_name}
                </span>
                <span className="text-[11px] flex-1 min-w-0 truncate" style={{ color: "var(--text-secondary)" }}>
                  {run.input_summary || "Ejecucion automatica"}
                </span>
                <span className="text-[9px] flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
                  {timeAgo(run.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
