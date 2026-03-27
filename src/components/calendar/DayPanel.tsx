"use client";

import { useEffect, useRef } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const DAY_NAMES = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const FMT_CONFIG: Record<string, { color: string; label: string }> = {
  reel: { color: "var(--red)", label: "Reel" },
  carousel: { color: "var(--olive)", label: "Carrusel" },
  story: { color: "var(--blue)", label: "Stories" },
  single: { color: "var(--purple)", label: "Post" },
};
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  scheduled: { color: "var(--olive)", label: "Programado" },
  approved: { color: "var(--amber)", label: "Aprobado" },
  suggested: { color: "var(--text-ghost)", label: "Pendiente" },
};

interface DayPanelProps {
  date: string;
  ideas: ScoredIdea[];
  onClose: () => void;
  onMarkDone: (ideaId: string) => void;
  onUnassign: (ideaId: string) => void;
  onCopy: (text: string) => void;
}

export default function DayPanel({ date, ideas, onClose, onMarkDone, onUnassign, onCopy }: DayPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const d = new Date(date + "T12:00:00");
  const dayName = DAY_NAMES[d.getDay()];
  const monthLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [date]);

  const formats = ["reel", "carousel", "story", "single"] as const;
  const done = ideas.filter((i) => i.status === "scheduled").length;
  const approved = ideas.filter((i) => i.status === "approved").length;
  const pending = ideas.filter((i) => i.status === "suggested").length;

  return (
    <div
      ref={ref}
      className="mt-3 rounded-[8px] p-4 relative overflow-hidden animate-[fadeUp_0.25s_ease-out]"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {/* Shine */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />

      <div className="relative z-[1]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{dayName}</span>
            <span className="ml-2" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>{monthLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Empty state */}
        {ideas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
              Sin contenido para este dia.
            </p>
            <p className="text-[9px] mt-1" style={{ color: "var(--text-ghost)" }}>
              Arrastra ideas desde la bandeja de arriba.
            </p>
          </div>
        )}

        {/* Format sections */}
        {formats.map((fmt) => {
          const fmtIdeas = ideas.filter((i) => i.format === fmt);
          if (fmtIdeas.length === 0) return null;
          const cfg = FMT_CONFIG[fmt];

          return (
            <div key={fmt} className="mb-4">
              {/* Section label */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: cfg.color }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
                  {cfg.label} · {fmtIdeas.length}
                </span>
              </div>

              {/* Ideas */}
              <div className="space-y-1.5">
                {fmtIdeas.map((idea) => {
                  const opacity = idea.total_score >= 8 ? 1 : idea.total_score >= 7 ? 0.88 : 0.7;
                  const st = STATUS_CONFIG[idea.status] || STATUS_CONFIG.suggested;

                  return (
                    <div
                      key={idea.id}
                      className="rounded-[6px] p-[10px_12px] relative overflow-hidden transition-colors hover:border-[rgba(255,255,255,0.2)] group"
                      style={{ opacity, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {/* Shine */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />

                      <div className="relative z-[1]">
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: cfg.color }}>
                            {idea.total_score.toFixed(1)}
                          </span>
                        </div>

                        {/* Hook */}
                        <p className="text-[12px] leading-[1.4]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
                          &ldquo;{idea.hook}&rdquo;
                        </p>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-[4px] h-[4px] rounded-full" style={{ background: st.color }} />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>{st.label}</span>
                        </div>

                        {/* Actions — visible on hover */}
                        <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idea.status !== "scheduled" ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onMarkDone(idea.id); }}
                              className="text-[7px] px-[10px] py-1 rounded-[5px]"
                              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
                            >
                              Marcar hecho
                            </button>
                          ) : (
                            <span className="text-[7px] px-[10px] py-1 rounded-[5px] opacity-50" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}>
                              Hecho ✓
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onCopy(idea.hook); }}
                            className="text-[7px] px-[10px] py-1 rounded-[5px]"
                            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            Copiar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onUnassign(idea.id); }}
                            className="text-[7px] px-[10px] py-1 rounded-[5px] hover:text-[var(--red)]"
                            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Stats bar */}
        {ideas.length > 0 && (
          <div className="flex items-center justify-center gap-[14px] pt-[10px] mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { n: done, label: "hechos", color: "var(--olive)" },
              { n: approved, label: "aprobados", color: "var(--amber)" },
              { n: pending, label: "pendientes", color: "var(--text-ghost)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-[4px] h-[4px] rounded-full" style={{ background: s.color }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-muted)" }}>{s.n} {s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
