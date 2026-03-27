"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

const FMT_COLOR: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const FMT_BG: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const FMT_LABEL: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const SRC_LABEL: Record<string, string> = { journal: "Journal", ideas_bar: "Ideas", intel: "Intel", program: "Programa", daily_suggestion: "Daily" };

interface IdeaHeroProps {
  idea: ScoredIdea;
}

export default function IdeaHero({ idea }: IdeaHeroProps) {
  const color = FMT_COLOR[idea.format] || "var(--olive)";

  return (
    <div
      className="rounded-[10px] p-5 mb-4 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
      <div className="relative z-[1]">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[8px] px-2 py-0.5 rounded-[5px]" style={{ fontFamily: "var(--font-mono)", background: FMT_BG[idea.format], color }}>{FMT_LABEL[idea.format]}</span>
          <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>{SRC_LABEL[idea.source] || idea.source}</span>
          {idea.temperature_score && <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>· Temp {idea.temperature_score}</span>}
        </div>

        {/* Hook */}
        <p className="text-[18px] leading-[1.35] mb-3" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
          &ldquo;{idea.hook}&rdquo;
        </p>

        {/* Score + description */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {idea.description && (
              <p className="text-[11px] leading-[1.4]" style={{ color: "var(--text-muted)" }}>{idea.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span style={{ fontFamily: "var(--font-display)", fontSize: 28, color, lineHeight: "1" }}>{idea.total_score.toFixed(1)}</span>
            <p className="text-[7px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>SCORE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
