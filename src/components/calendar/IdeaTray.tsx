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
    <div className="mb-2 rounded-[8px] overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header + count */}
      <div className="flex items-center justify-between px-2.5 py-1.5 md:py-2">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)" }}>
          Sin asignar
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--olive)" }}>{ideas.length}</span>
      </div>

      {/* MOBILE — chips (compact, 1 row, scroll) */}
      <div className="flex gap-1 px-2 pb-2 overflow-x-auto md:hidden" style={{ scrollbarWidth: "none" }}>
        {ideas.map((idea) => (
          <div
            key={idea.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", idea.id); e.dataTransfer.effectAllowed = "move"; onDragStart(idea.id); }}
            onDragEnd={onDragEnd}
            className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full cursor-grab active:cursor-grabbing active:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", maxWidth: 160 }}
          >
            <span className="w-[5px] h-[5px] rounded-sm flex-shrink-0" style={{ background: FMT_COLOR[idea.format] || "var(--olive)" }} />
            <span className="truncate text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {idea.hook.slice(0, 22)}{idea.hook.length > 22 ? "…" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* DESKTOP — full cards */}
      <div className="hidden md:flex gap-1.5 px-2.5 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        {ideas.map((idea) => (
          <div
            key={idea.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", idea.id); e.dataTransfer.effectAllowed = "move"; onDragStart(idea.id); }}
            onDragEnd={onDragEnd}
            className="flex-shrink-0 min-w-[160px] max-w-[200px] p-[8px_10px] rounded-[6px] cursor-grab active:cursor-grabbing active:opacity-50 transition-transform hover:translate-y-[-2px]"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "var(--olive)" }}>{idea.total_score.toFixed(1)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 6, color: "var(--text-ghost)" }}>{SRC_LABELS[idea.source] || idea.source}</span>
            </div>
            <p className="text-[9px] leading-[1.3] line-clamp-2 mb-1" style={{ color: "var(--text-secondary)" }}>{idea.hook}</p>
            <span className="text-[6px] px-[5px] py-[1px] rounded-[3px]" style={{ fontFamily: "var(--font-mono)", background: FMT_BG[idea.format], color: FMT_COLOR[idea.format] }}>{FMT_LABEL[idea.format]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
