"use client";

import { useEffect, useRef } from "react";
import IdeaCard from "./IdeaCard";
import GlassCard from "@/components/mirror/GlassCard";
import type { ScoredIdea } from "@/lib/supabase/program-output";

interface DayDetailProps {
  date: string;
  dayName: string;
  dayNum: number;
  dateLabel: string;
  ideas: ScoredIdea[];
  unassigned: ScoredIdea[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreatePost: (idea: ScoredIdea) => void;
  onAssign: (id: string) => void;
}

const FORMAT_CONFIG: { key: string; label: string; color: string; match: (f: string) => boolean }[] = [
  { key: "reel", label: "REEL", color: "var(--surface)", match: (f) => f === "reel" },
  { key: "carousel", label: "CARRUSEL", color: "var(--middle)", match: (f) => f === "carousel" },
  { key: "story", label: "STORIES", color: "var(--conversion)", match: (f) => f === "story" },
  { key: "single", label: "POST", color: "var(--depth)", match: (f) => f === "single" },
];

export default function DayDetail({ date, dayName, dayNum, dateLabel, ideas, unassigned, onClose, onApprove, onReject, onCreatePost, onAssign }: DayDetailProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [date]);

  const scheduled = ideas.filter((i) => i.status === "scheduled").length;
  const approved = ideas.filter((i) => i.status === "approved").length;
  const pending = ideas.filter((i) => i.status === "suggested").length;
  const dayHooks = ideas.map((i) => i.hook).filter(Boolean);
  const isEmpty = ideas.length === 0;

  return (
    <div ref={ref} className="animate-[fadeUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h2
            className="text-[24px] font-[800] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {dayName} {dayNum}
          </h2>
          <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {dateLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-[16px] p-2"
        >
          ✕
        </button>
      </div>

      {/* Empty day */}
      {isEmpty && unassigned.length === 0 && (
        <div className="text-center py-12">
          <p
            className="text-[16px] font-[800]"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}
          >
            Dia libre
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-ghost)" }}>
            Sin contenido programado
          </p>
        </div>
      )}

      {/* Format sections */}
      {FORMAT_CONFIG.map(({ key, label, color, match }) => {
        const sectionIdeas = ideas.filter((i) => match(i.format));
        if (sectionIdeas.length === 0) return null;

        return (
          <div key={key} className="mb-5">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: color }} />
              <span
                className="text-[9px] tracking-[0.15em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
              >
                {label}
              </span>
            </div>
            <div className="border-b mb-3" style={{ borderColor: "var(--border)" }} />

            {/* Ideas */}
            <div className="space-y-2">
              {sectionIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  color={color}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCreatePost={onCreatePost}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Twitter / X hooks */}
      {dayHooks.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--text-muted)" }} />
            <span
              className="text-[9px] tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              TWITTER / X
            </span>
          </div>
          <div className="border-b mb-3" style={{ borderColor: "var(--border)" }} />

          <div className="flex flex-wrap gap-2">
            {dayHooks.map((hook, i) => (
              <span
                key={i}
                className="text-[11px] px-3 py-1.5 rounded-[20px] inline-block"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "var(--text-secondary)",
                  background: "rgba(0,0,0,0.1)",
                  borderLeft: "2px solid var(--text-muted)",
                }}
              >
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status bar */}
      {ideas.length > 0 && (
        <GlassCard intensity="ghost" className="p-2.5 mb-4">
          <p className="text-center text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {scheduled} programados · {approved} aprobados · {pending} pendientes
          </p>
        </GlassCard>
      )}

      {/* Unassigned ideas */}
      {unassigned.length > 0 && (
        <div className="mt-2">
          <div className="border-t pt-4 mb-3" style={{ borderColor: "var(--border)" }}>
            <span
              className="text-[8px] tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
            >
              IDEAS DISPONIBLES SIN ASIGNAR
            </span>
          </div>

          <div className="space-y-2">
            {unassigned.slice(0, 5).map((idea) => {
              const cfg = FORMAT_CONFIG.find((f) => f.match(idea.format)) || FORMAT_CONFIG[0];
              return (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  color={cfg.color}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCreatePost={onCreatePost}
                  assignLabel={`Asignar a ${dayName}`}
                  onAssign={onAssign}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
