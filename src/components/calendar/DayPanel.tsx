"use client";

import { useState, useEffect, useRef } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const DAY_NAMES = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const FMT_CFG: Record<string, { color: string; label: string }> = {
  reel: { color: "#D4655B", label: "REEL" },
  carousel: { color: "#93A87A", label: "CARRUSEL" },
  story: { color: "#7BA3C4", label: "STORIES" },
  single: { color: "#A88EC4", label: "POST" },
};
const STATUS_CLR: Record<string, string> = { scheduled: "#93A87A", approved: "#D4B85A", suggested: "rgba(255,255,255,0.3)" };

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
  const [menuId, setMenuId] = useState<string | null>(null);
  const d = new Date(date + "T12:00:00");

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [date]);

  const done = ideas.filter((i) => i.status === "scheduled").length;
  const approved = ideas.filter((i) => i.status === "approved").length;
  const pending = ideas.filter((i) => i.status === "suggested").length;

  const FORMATS = ["reel", "carousel", "story", "single"] as const;

  return (
    <div
      ref={ref}
      className="mt-2 rounded-lg overflow-hidden animate-[fadeUp_0.2s_ease-out]"
      style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{DAY_NAMES[d.getDay()]}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(255,255,255,0.5)" }}>
            {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
        >
          ×
        </button>
      </div>

      {/* Empty */}
      {ideas.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>
            Sin contenido. Arrastra desde la bandeja.
          </p>
        </div>
      )}

      {/* Sections by format */}
      {FORMATS.map((fmt) => {
        const fmtIdeas = ideas.filter((i) => i.format === fmt);
        if (fmtIdeas.length === 0) return null;
        const cfg = FMT_CFG[fmt] || FMT_CFG.reel;

        return (
          <div key={fmt}>
            {/* Section header */}
            <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1">
              <span className="w-[5px] h-[5px] rounded-sm flex-shrink-0" style={{ background: cfg.color }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)" }}>
                {cfg.label} · {fmtIdeas.length}
              </span>
            </div>

            {/* Idea rows */}
            {fmtIdeas.map((idea) => (
              <div key={idea.id}>
                <div
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ borderLeft: `2px solid ${cfg.color}`, marginLeft: 4 }}
                  onClick={() => setMenuId(menuId === idea.id ? null : idea.id)}
                >
                  {/* Score */}
                  <span className="min-w-[24px] text-center text-[11px]" style={{ fontFamily: "var(--font-display)", color: cfg.color }}>
                    {idea.total_score.toFixed(1)}
                  </span>

                  {/* Hook — truncated */}
                  <span className="flex-1 truncate text-[11px] leading-tight" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
                    &ldquo;{idea.hook}&rdquo;
                  </span>

                  {/* Status dot */}
                  <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: STATUS_CLR[idea.status] || "rgba(255,255,255,0.3)" }} />

                  {/* More */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuId(menuId === idea.id ? null : idea.id); }}
                    className="flex-shrink-0 px-1 text-[14px]"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    ···
                  </button>
                </div>

                {/* Inline action menu */}
                {menuId === idea.id && (
                  <div className="flex gap-1 px-2 pb-2 pt-1 ml-1 animate-[fadeUp_0.15s_ease-out]">
                    {idea.status !== "scheduled" ? (
                      <button
                        onClick={() => { onMarkDone(idea.id); setMenuId(null); }}
                        className="text-[7px] px-2 py-1 rounded"
                        style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(122,140,101,0.15)", color: "#93A87A" }}
                      >
                        Hecho
                      </button>
                    ) : (
                      <span className="text-[7px] px-2 py-1 rounded opacity-50" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(122,140,101,0.15)", color: "#93A87A" }}>
                        ✓ Hecho
                      </span>
                    )}
                    <button
                      onClick={() => { onCopy(idea.hook); setMenuId(null); }}
                      className="text-[7px] px-2 py-1 rounded"
                      style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => { onUnassign(idea.id); setMenuId(null); }}
                      className="text-[7px] px-2 py-1 rounded hover:text-[#D4655B]"
                      style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)" }}
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Stats footer */}
      {ideas.length > 0 && (
        <div className="flex justify-center gap-3 px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { n: done, label: "hechos", color: "#93A87A" },
            { n: approved, label: "aprob", color: "#D4B85A" },
            { n: pending, label: "pend", color: "rgba(255,255,255,0.3)" },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "rgba(255,255,255,0.4)" }}>
              <span className="w-1 h-1 rounded-full" style={{ background: s.color }} /> {s.n} {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
