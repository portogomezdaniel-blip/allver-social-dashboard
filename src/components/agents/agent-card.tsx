"use client";

import { Agent, AgentStatus } from "@/lib/mock-agents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowButton } from "@/components/ui/glow-button";

const statusConfig: Record<
  AgentStatus,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Activo",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  idle: {
    label: "En espera",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  error: {
    label: "Error",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  isRunning: boolean;
  onSelect: () => void;
  onTrigger: () => void;
}

export function AgentCard({
  agent,
  isSelected,
  isRunning,
  onSelect,
  onTrigger,
}: AgentCardProps) {
  const status = statusConfig[agent.status];

  return (
    <Card
      className={`bg-card border-border cursor-pointer transition-all ${
        isSelected
          ? "border-primary ring-1 ring-primary/30"
          : "hover:border-primary/30"
      }`}
      onClick={onSelect}
    >
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status.dot} ${agent.status === "active" ? "animate-pulse" : ""}`} />
            <h3 className="text-sm font-semibold text-foreground">
              {agent.name}
            </h3>
          </div>
          <Badge variant="outline" className={status.color}>
            {status.label}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {agent.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Exito</p>
            <p className="text-sm font-semibold text-foreground">
              {agent.successRate}%
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Runs</p>
            <p className="text-sm font-semibold text-foreground">
              {agent.totalRuns}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Ultimo</p>
            <p className="text-[11px] font-medium text-foreground">
              {formatTime(agent.lastRun)}
            </p>
          </div>
        </div>

        {/* Next scheduled */}
        {agent.nextScheduled && (
          <p className="text-[11px] text-muted-foreground mb-3">
            Proximo run: {formatTime(agent.nextScheduled)}
          </p>
        )}
        {agent.status === "error" && !agent.nextScheduled && (
          <p className="text-[11px] text-red-400 mb-3">
            Ejecucion pausada — requiere accion manual
          </p>
        )}

        {/* Trigger button */}
        <GlowButton
          containerClassName="w-full"
          className="w-full text-center"
          disabled={isRunning}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onTrigger();
          }}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Ejecutando...
            </span>
          ) : (
            "Ejecutar ahora"
          )}
        </GlowButton>
      </CardContent>
    </Card>
  );
}
