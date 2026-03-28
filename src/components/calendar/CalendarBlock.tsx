"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

const FMT_BG: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const FMT_COLOR: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const FMT_LABEL: Record<string, string> = { reel: "Reel", carousel: "Car", story: "Sty", single: "Post" };
const STATUS_COLOR: Record<string, string> = { scheduled: "var(--olive)", approved: "var(--amber)", suggested: "var(--text-ghost)" };

interface CalendarBlockProps {
  idea: ScoredIdea;
  onDragStart: (ideaId: string) => void;
  onDragEnd: () => void;
}

export default function CalendarBlock({ idea, onDragStart, onDragEnd }: CalendarBlockProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", idea.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(idea.id);
      }}
      onDragEnd={onDragEnd}
      className="flex items-center gap-[2px] md:gap-[3px] px-0.5 md:px-1 py-[1px] md:py-[2px] rounded-[2px] md:rounded-[3px] cursor-grab active:cursor-grabbing active:opacity-60"
      style={{ background: FMT_BG[idea.format] || "var(--olive-bg)" }}
    >
      <div className="w-[3px] h-[3px] md:w-1 md:h-1 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[idea.status] || "var(--text-ghost)" }} />
      <span className="hidden md:inline" style={{ fontFamily: "var(--font-mono)", fontSize: 6, textTransform: "uppercase" as const, color: FMT_COLOR[idea.format] || "var(--olive)" }}>
        {FMT_LABEL[idea.format] || idea.format}
      </span>
    </div>
  );
}
