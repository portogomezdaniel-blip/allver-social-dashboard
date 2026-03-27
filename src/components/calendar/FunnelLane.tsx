"use client";

import GlassCard from "@/components/mirror/GlassCard";
import IdeaCard from "./IdeaCard";
import type { ScoredIdea } from "@/lib/supabase/program-output";

interface FunnelLaneProps {
  lane: "filter" | "authority" | "conversion";
  ideas: ScoredIdea[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updates: { hook?: string; description?: string }) => void;
}

const LANE_CONFIG = {
  filter: {
    color: "var(--surface)",
    label: "SUPERFICIE · FILTRA",
    subtitle: "Reels que filtran por conciencia",
  },
  authority: {
    color: "var(--middle)",
    label: "MEDIO · AUTORIDAD",
    subtitle: "Carruseles que construyen confianza",
  },
  conversion: {
    color: "var(--conversion)",
    label: "CONVERSION · CTA",
    subtitle: "Stories + X que generan accion",
  },
};

export default function FunnelLane({ lane, ideas, onApprove, onReject, onEdit }: FunnelLaneProps) {
  const config = LANE_CONFIG[lane];

  return (
    <GlassCard intensity="subtle" className="p-3 relative overflow-hidden">
      <div style={{ borderTop: `3px solid ${config.color}`, marginTop: -12, marginLeft: -12, marginRight: -12, paddingTop: 12, paddingLeft: 12, paddingRight: 12, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
        {/* Lane header */}
        <p className="text-[8px] tracking-[0.15em] uppercase font-mono mb-0.5" style={{ color: config.color }}>
          {config.label}
        </p>
        <p className="text-[9px] mb-3" style={{ color: "var(--text-muted)" }}>
          {config.subtitle}
        </p>

        {/* Ideas */}
        {ideas.length > 0 ? (
          <div className="space-y-2">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onApprove={onApprove}
                onReject={onReject}
                onEdit={onEdit}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-ghost)" }}>
            Sin ideas asignadas
          </p>
        )}
      </div>
    </GlassCard>
  );
}
