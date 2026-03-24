"use client";

import { useState, useCallback } from "react";
import { Agent, mockAgents, mockLog, AgentLogEntry } from "@/lib/mock-agents";
import { AgentCard } from "@/components/agents/agent-card";
import { OutputPreview } from "@/components/agents/output-preview";
import { ActivityLog } from "@/components/agents/activity-log";
import { useLocale } from "@/lib/locale-context";

export default function AgentControlPanel() {
  const { t } = useLocale();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [log, setLog] = useState<AgentLogEntry[]>(mockLog);
  const [selectedId, setSelectedId] = useState<string>(mockAgents[0].id);
  const [runningId, setRunningId] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? agents[0];

  const handleTrigger = useCallback(
    (agentId: string) => {
      setRunningId(agentId);
      setSelectedId(agentId);

      // Simulate agent execution
      setTimeout(() => {
        const now = new Date().toISOString();
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  status: "active" as const,
                  lastRun: now,
                  totalRuns: a.totalRuns + 1,
                  lastOutput: {
                    ...a.lastOutput,
                    generatedAt: now,
                    status: "pending" as const,
                  },
                }
              : a
          )
        );

        const agent = agents.find((a) => a.id === agentId)!;
        const newEntry: AgentLogEntry = {
          id: `log-${Date.now()}`,
          agentId,
          agentName: agent.name,
          action: t("agents.manual_execution"),
          timestamp: now,
          status: "success",
          detail: t("agents.manual_trigger"),
        };
        setLog((prev) => [newEntry, ...prev.slice(0, 9)]);
        setRunningId(null);
      }, 2500);
    },
    [agents]
  );

  function handleApprove(outputId: string) {
    const now = new Date().toISOString();
    setAgents((prev) =>
      prev.map((a) =>
        a.lastOutput.id === outputId
          ? {
              ...a,
              lastOutput: { ...a.lastOutput, status: "approved" as const },
            }
          : a
      )
    );
    const agent = agents.find((a) => a.lastOutput.id === outputId);
    if (agent) {
      const entry: AgentLogEntry = {
        id: `log-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        action: t("agents.approved"),
        timestamp: now,
        status: "success",
        detail: t("agents.sent_to_queue"),
      };
      setLog((prev) => [entry, ...prev.slice(0, 9)]);
    }
  }

  function handleReject(outputId: string) {
    const now = new Date().toISOString();
    setAgents((prev) =>
      prev.map((a) =>
        a.lastOutput.id === outputId
          ? {
              ...a,
              lastOutput: { ...a.lastOutput, status: "rejected" as const },
            }
          : a
      )
    );
    const agent = agents.find((a) => a.lastOutput.id === outputId);
    if (agent) {
      const entry: AgentLogEntry = {
        id: `log-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        action: t("agents.rejected"),
        timestamp: now,
        status: "pending",
        detail: t("agents.will_regenerate"),
      };
      setLog((prev) => [entry, ...prev.slice(0, 9)]);
    }
  }

  // Summary counts
  const activeCount = agents.filter((a) => a.status === "active").length;
  const errorCount = agents.filter((a) => a.status === "error").length;
  const pendingOutputs = agents.filter(
    (a) => a.lastOutput.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("agents.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("agents.subtitle")}
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">
            {t("agents.active")}:{" "}
            <span className="text-foreground font-medium">{activeCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-muted-foreground">
            {t("agents.errors")}:{" "}
            <span className="text-foreground font-medium">{errorCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-muted-foreground">
            {t("agents.pending_review")}:{" "}
            <span className="text-foreground font-medium">
              {pendingOutputs}
            </span>
          </span>
        </div>
      </div>

      {/* Main layout: agents + output */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Agent cards column */}
        <div className="xl:col-span-4 space-y-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedId === agent.id}
              isRunning={runningId === agent.id}
              onSelect={() => setSelectedId(agent.id)}
              onTrigger={() => handleTrigger(agent.id)}
            />
          ))}
        </div>

        {/* Output preview column */}
        <div className="xl:col-span-8">
          <OutputPreview
            agent={selectedAgent}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>

      {/* Activity log */}
      <ActivityLog log={log} />
    </div>
  );
}
