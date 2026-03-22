"use client";

import { AgentLogEntry } from "@/lib/mock-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusDot: Record<string, string> = {
  success: "bg-emerald-400",
  error: "bg-red-400",
  pending: "bg-amber-400",
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const agentColors: Record<string, string> = {
  "agent-instagram": "text-purple-400",
  "agent-andrea": "text-cyan-400",
  "agent-amethyst": "text-pink-400",
};

interface ActivityLogProps {
  log: AgentLogEntry[];
}

export function ActivityLog({ log }: ActivityLogProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Registro de actividad — ultimas 10 acciones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {log.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-6 py-3 hover:bg-muted/10 transition-colors"
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusDot[entry.status]}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs font-medium ${agentColors[entry.agentId] ?? "text-muted-foreground"}`}
                  >
                    {entry.agentName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
