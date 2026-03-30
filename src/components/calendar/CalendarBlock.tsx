"use client";

import { useRouter } from "next/navigation";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const FMT_COLOR: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const FMT_LABEL: Record<string, string> = { reel: "Reel", carousel: "Car", story: "Sty", single: "Post" };
const STATUS_COLOR: Record<string, string> = { scheduled: "var(--olive)", approved: "var(--amber)", suggested: "var(--text-ghost)" };

interface CalendarBlockProps {
  idea: ScoredIdea;
  onDragStart: (ideaId: string) => void;
  onDragEnd: () => void;
}

export default function CalendarBlock({ idea, onDragStart, onDragEnd }: CalendarBlockProps) {
  const router = useRouter();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", idea.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(idea.id);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/ideas/${idea.id}`);
      }}
      className="h-[2px] md:h-auto md:flex md:items-center md:gap-[3px] md:px-1 md:py-[2px] rounded-[1px] md:rounded-[3px] cursor-pointer active:cursor-grabbing active:opacity-60"
      style={{ background: FMT_COLOR[idea.format] || "var(--olive)" }}
    >
      <div className="hidden md:block w-1 h-1 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[idea.status] || "var(--text-ghost)" }} />
      <span className="hidden md:inline" style={{ fontFamily: "var(--font-mono)", fontSize: 6, textTransform: "uppercase" as const, color: FMT_COLOR[idea.format] || "var(--olive)" }}>
        {FMT_LABEL[idea.format] || idea.format}
      </span>
    </div>
  );
}
