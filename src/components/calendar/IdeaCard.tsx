"use client";

import { useState } from "react";
import GlassCard from "@/components/mirror/GlassCard";
import type { ScoredIdea } from "@/lib/supabase/program-output";

interface IdeaCardProps {
  idea: ScoredIdea;
  color: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreatePost: (idea: ScoredIdea) => void;
  assignLabel?: string;
  onAssign?: (id: string) => void;
}

function scoreOpacity(score: number): number {
  if (score >= 8.5) return 1;
  if (score >= 7) return 0.88;
  if (score >= 5) return 0.7;
  return 0.45;
}

function platformLabel(format: string): string {
  switch (format) {
    case "reel": return "REEL";
    case "carousel": return "CARRUSEL";
    case "story": return "STORY";
    case "single": return "POST";
    default: return format.toUpperCase();
  }
}

export default function IdeaCard({ idea, color, onApprove, onReject, onCreatePost, assignLabel, onAssign }: IdeaCardProps) {
  const [fading, setFading] = useState(false);

  function handleReject() {
    setFading(true);
    setTimeout(() => onReject(idea.id), 300);
  }

  const status = idea.status;

  return (
    <GlassCard
      intensity="ghost"
      className={`p-3 transition-all duration-300 hover:brightness-105 ${fading ? "opacity-0 scale-95" : ""}`}
    >
      <div style={{ opacity: assignLabel ? 0.55 : scoreOpacity(idea.total_score) }}>
        {/* Row 1: platform + score */}
        <div className="flex items-center justify-between">
          <span
            className="text-[8px] tracking-[0.15em] uppercase"
            style={{ fontFamily: "var(--font-mono)", color }}
          >
            {platformLabel(idea.format)}
          </span>
          <span
            className="text-[16px] font-[800]"
            style={{ fontFamily: "var(--font-display)", color, lineHeight: 1 }}
          >
            {idea.total_score.toFixed(1)}
          </span>
        </div>

        {/* Row 2: hook */}
        <p
          className="text-[13px] mt-1.5 leading-[1.4]"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}
        >
          &ldquo;{idea.hook}&rdquo;
        </p>

        {/* Row 3: description */}
        {idea.description && (
          <p
            className="text-[11px] mt-1 leading-[1.4] font-light"
            style={{ color: "var(--text-muted)" }}
          >
            {idea.description}
          </p>
        )}

        {/* Row 4: actions */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {assignLabel && onAssign ? (
            <button
              onClick={() => onAssign(idea.id)}
              className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                background: "rgba(168,183,142,0.12)",
                color: "var(--middle)",
                border: "0.5px solid rgba(168,183,142,0.2)",
              }}
            >
              {assignLabel}
            </button>
          ) : status === "suggested" ? (
            <>
              <button
                onClick={() => onApprove(idea.id)}
                className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(168,183,142,0.12)",
                  color: "var(--middle)",
                  border: "0.5px solid rgba(168,183,142,0.2)",
                }}
              >
                Aprobar
              </button>
              <button
                onClick={handleReject}
                className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors hover:text-[var(--surface)]"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text-muted)",
                  border: "0.5px solid transparent",
                }}
              >
                ✕
              </button>
            </>
          ) : status === "approved" ? (
            <>
              <span
                className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(168,183,142,0.12)",
                  color: "var(--middle)",
                  border: "0.5px solid rgba(168,183,142,0.2)",
                  opacity: 0.6,
                }}
              >
                ✓ Aprobado
              </span>
              <button
                onClick={() => onCreatePost(idea)}
                className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(107,140,186,0.12)",
                  color: "var(--conversion)",
                  border: "0.5px solid rgba(107,140,186,0.15)",
                }}
              >
                Crear post
              </button>
            </>
          ) : (
            <span
              className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px]"
              style={{
                fontFamily: "var(--font-mono)",
                background: "rgba(168,183,142,0.08)",
                color: "var(--middle)",
                opacity: 0.5,
              }}
            >
              ✓ Programado
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
