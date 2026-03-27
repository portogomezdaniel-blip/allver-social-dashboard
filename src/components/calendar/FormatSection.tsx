"use client";

import { useState } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";

interface FormatSectionProps {
  format: string;
  label: string;
  platform: string;
  color: string;
  ideas: ScoredIdea[];
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function FormatSection({ format, label, platform, color, ideas, isExpanded, onToggle, onApprove, onReject }: FormatSectionProps) {
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  const scheduled = ideas.filter((i) => i.status === "scheduled").length;
  const total = ideas.length;
  const statusLabel = scheduled === total && total > 0 ? "✓" : `${total}`;

  function handleReject(id: string) {
    setFadingIds((prev) => new Set(prev).add(id));
    setTimeout(() => onReject(id), 300);
  }

  return (
    <div
      className="mb-3 rounded-[12px] overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        border: "0.5px solid rgba(168,183,142,0.08)",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-[14px_16px] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center gap-3">
          {/* Color bar */}
          <div className="w-[4px] h-[32px] rounded-[2px] flex-shrink-0" style={{ background: color }} />
          <div>
            <span
              className="text-[14px] font-[800] tracking-[-0.01em] block"
              style={{ fontFamily: "var(--font-display)", color }}
            >
              {label}
            </span>
            <span
              className="text-[8px] tracking-[0.08em] uppercase block mt-0.5"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              {platform}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[8px]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            {statusLabel} opciones
          </span>
          <span
            className="text-[10px] transition-transform"
            style={{ color: "var(--text-ghost)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-[fadeUp_0.25s_ease-out]">
          <div className="border-t mb-3" style={{ borderColor: "var(--border)" }} />

          {ideas.length > 0 ? (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className={`rounded-[8px] p-3 transition-all hover:border-[var(--border)] ${fadingIds.has(idea.id) ? "opacity-0 scale-95" : ""}`}
                  style={{
                    background: "rgba(0,0,0,0.1)",
                    border: "0.5px solid transparent",
                    transition: "all 0.3s",
                  }}
                >
                  {/* Hook */}
                  <p
                    className="text-[13px] leading-[1.4]"
                    style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}
                  >
                    &ldquo;{idea.hook}&rdquo;
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-1.5">
                    {idea.description && (
                      <p className="text-[10px] font-light flex-1 min-w-0 mr-2" style={{ color: "var(--text-muted)" }}>
                        {idea.description}
                      </p>
                    )}
                    <span
                      className="text-[13px] font-[800] flex-shrink-0"
                      style={{ fontFamily: "var(--font-display)", color, lineHeight: 1 }}
                    >
                      {idea.total_score.toFixed(1)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {idea.status === "suggested" && (
                      <>
                        <button
                          onClick={() => onApprove(idea.id)}
                          className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
                          style={{ fontFamily: "var(--font-mono)", background: "rgba(168,183,142,0.12)", color: "var(--middle)", border: "0.5px solid rgba(168,183,142,0.2)" }}
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(idea.id)}
                          className="text-[8px] tracking-[0.08em] uppercase px-2.5 py-[5px] rounded-[8px] transition-colors hover:text-[#C4453A]"
                          style={{ fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.03)", color: "var(--text-muted)" }}
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {idea.status === "approved" && (
                      <>
                        <span
                          className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] opacity-60"
                          style={{ fontFamily: "var(--font-mono)", background: "rgba(168,183,142,0.12)", color: "var(--middle)" }}
                        >
                          ✓ Aprobado
                        </span>
                        <button
                          className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
                          style={{ fontFamily: "var(--font-mono)", background: "rgba(107,140,186,0.12)", color: "#6B8CBA", border: "0.5px solid rgba(107,140,186,0.15)" }}
                          onClick={() => console.log("TODO: crear post desde idea", idea.id)}
                        >
                          Crear post
                        </button>
                      </>
                    )}
                    {idea.status === "scheduled" && (
                      <span
                        className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] opacity-50"
                        style={{ fontFamily: "var(--font-mono)", background: "rgba(168,183,142,0.08)", color: "var(--middle)" }}
                      >
                        ✓ Programado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[9px] py-4" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
              Sin opciones de copy
            </p>
          )}

          {/* Generate more */}
          <button
            onClick={() => console.log("TODO: llamar agente de hooks para formato:", format)}
            className="w-full mt-3 py-2 rounded-[8px] text-center transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--middle)",
              border: "1px dashed rgba(168,183,142,0.3)",
              background: "transparent",
            }}
          >
            GENERAR MÁS OPCIONES
          </button>
        </div>
      )}
    </div>
  );
}
