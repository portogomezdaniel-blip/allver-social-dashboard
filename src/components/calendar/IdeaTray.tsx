"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

const FMT_BG: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const FMT_COLOR: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const FMT_LABEL: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const SRC_LABELS: Record<string, string> = { journal: "Journal", ideas_bar: "Ideas", intel: "Intel", program: "Programa", daily_suggestion: "Daily" };

interface IdeaTrayProps {
  ideas: ScoredIdea[];
  onDragStart: (ideaId: string) => void;
  onDragEnd: () => void;
}

export default function IdeaTray({ ideas, onDragStart, onDragEnd }: IdeaTrayProps) {
  if (ideas.length === 0) return null;

  return (
    <div
      className="mb-4 p-3 rounded-[8px] relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {/* Shine */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />

      <div className="relative z-[1]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
            IDEAS SIN ASIGNAR · ARRASTRA AL CALENDARIO
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--olive)" }}>{ideas.length}</span>
        </div>

        {/* Scrollable cards */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          {ideas.map((idea) => (
            <div
              key={idea.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", idea.id);
                e.dataTransfer.effectAllowed = "move";
                onDragStart(idea.id);
              }}
              onDragEnd={onDragEnd}
              className="flex-shrink-0 min-w-[160px] max-w-[200px] p-[8px_10px] rounded-[6px] cursor-grab active:cursor-grabbing active:opacity-50 transition-transform hover:translate-y-[-2px]"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {/* Score + source */}
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--olive)" }}>
                  {idea.total_score.toFixed(1)}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 6, color: "var(--text-ghost)" }}>
                  {SRC_LABELS[idea.source] || idea.source}
                </span>
              </div>

              {/* Hook */}
              <p className="text-[10px] leading-[1.3] line-clamp-2 mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {idea.hook}
              </p>

              {/* Format tag */}
              <span
                className="text-[6px] px-[5px] py-[1px] rounded-[3px]"
                style={{ fontFamily: "var(--font-mono)", background: FMT_BG[idea.format], color: FMT_COLOR[idea.format] }}
              >
                {FMT_LABEL[idea.format] || idea.format}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
