"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
const FORMATS = ["reel", "carousel", "story", "single"] as const;

interface DayPanelProps {
  date: string;
  ideas: ScoredIdea[];
  onClose: () => void;
  onMarkDone: (ideaId: string) => void;
  onUnassign: (ideaId: string) => void;
  onCopy: (text: string) => void;
}

export default function DayPanel({ date, ideas, onClose, onMarkDone, onUnassign, onCopy }: DayPanelProps) {
  const router = useRouter();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const d = new Date(date + "T12:00:00");

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const done = ideas.filter((i) => i.status === "scheduled").length;
  const approved = ideas.filter((i) => i.status === "approved").length;
  const pending = ideas.filter((i) => i.status === "suggested").length;

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  // Shared content for both mobile and desktop
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{DAY_NAMES[d.getDay()]}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(255,255,255,0.5)" }}>
            {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}
          </span>
        </div>
        <button onClick={handleClose} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(70vh - 80px)" }}>
        {ideas.length === 0 && (
          <div className="text-center py-6">
            <p className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>Sin contenido. Arrastra desde la bandeja.</p>
          </div>
        )}

        {FORMATS.map((fmt) => {
          const fmtIdeas = ideas.filter((i) => i.format === fmt);
          if (fmtIdeas.length === 0) return null;
          const cfg = FMT_CFG[fmt] || FMT_CFG.reel;

          return (
            <div key={fmt}>
              <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1">
                <span className="w-[5px] h-[5px] rounded-sm flex-shrink-0" style={{ background: cfg.color }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)" }}>
                  {cfg.label} · {fmtIdeas.length}
                </span>
              </div>

              {fmtIdeas.map((idea) => (
                <div key={idea.id}>
                  <div
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    style={{ borderLeft: `2px solid ${cfg.color}`, marginLeft: 4 }}
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                  >
                    <span className="min-w-[24px] text-center text-[11px]" style={{ fontFamily: "var(--font-display)", color: cfg.color }}>
                      {idea.total_score.toFixed(1)}
                    </span>
                    <span className="flex-1 truncate text-[11px] leading-tight" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
                      &ldquo;{idea.hook}&rdquo;
                    </span>
                    <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: STATUS_CLR[idea.status] || "rgba(255,255,255,0.3)" }} />
                    <button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === idea.id ? null : idea.id); }} className="flex-shrink-0 px-1 text-[14px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      ···
                    </button>
                  </div>

                  {menuId === idea.id && (
                    <div className="flex gap-1 px-2 pb-2 pt-1 ml-1 animate-[fadeUp_0.15s_ease-out]">
                      {idea.status !== "scheduled" ? (
                        <button onClick={() => { onMarkDone(idea.id); setMenuId(null); }} className="text-[7px] px-2 py-1 rounded" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(122,140,101,0.15)", color: "#93A87A" }}>Hecho</button>
                      ) : (
                        <span className="text-[7px] px-2 py-1 rounded opacity-50" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(122,140,101,0.15)", color: "#93A87A" }}>✓ Hecho</span>
                      )}
                      <button onClick={() => { onCopy(idea.hook); setMenuId(null); }} className="text-[7px] px-2 py-1 rounded" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>Copiar</button>
                      <button onClick={() => { onUnassign(idea.id); setMenuId(null); }} className="text-[7px] px-2 py-1 rounded hover:text-[#D4655B]" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)" }}>Quitar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      {ideas.length > 0 && (
        <div className="flex justify-center gap-3 px-3 py-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
    </>
  );

  return (
    <>
      {/* MOBILE — slide-up fixed bottom sheet */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[90] transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.4)", opacity: visible ? 1 : 0 }}
          onClick={handleClose}
        />
        {/* Panel */}
        <div
          className="fixed left-0 right-0 bottom-0 z-[95] flex flex-col rounded-t-xl transition-transform duration-200"
          style={{
            maxHeight: "70vh",
            background: "rgba(50,53,46,0.98)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            transform: visible ? "translateY(0)" : "translateY(100%)",
          }}
        >
          {/* Grab handle */}
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-8 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
          {panelContent}
        </div>
      </div>

      {/* DESKTOP — inline below grid */}
      <div className="hidden md:block mt-2 rounded-lg overflow-hidden animate-[fadeUp_0.2s_ease-out]" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {panelContent}
      </div>
    </>
  );
}
