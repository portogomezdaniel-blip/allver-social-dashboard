"use client";

import { useMemo } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DbPost } from "@/lib/supabase/posts";

interface MonthGridProps {
  year: number;
  month: number;
  ideas: ScoredIdea[];
  posts: DbPost[];
  selectedWeekStart: string | null;
  onSelectDay: (date: string) => void;
}

const DAY_HEADERS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const FORMATS = ["reel", "carousel", "story", "single"] as const;
const FORMAT_COLORS: Record<string, string> = {
  reel: "#C4453A",
  carousel: "#A8B78E",
  story: "#6B8CBA",
  single: "#9B7EB8",
};

interface DayCell {
  date: string;
  num: number;
  inMonth: boolean;
  isToday: boolean;
  bars: { format: string; opacity: number }[];
}

function buildCalendarDays(year: number, month: number, ideas: ScoredIdea[], posts: DbPost[]): DayCell[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const todayStr = new Date().toLocaleDateString("en-CA");

  // Monday-based offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: DayCell[] = [];

  // Days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d.toLocaleDateString("en-CA"), num: d.getDate(), inMonth: false, isToday: false, bars: [] });
  }

  // Days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toLocaleDateString("en-CA");

    const dayIdeas = ideas.filter((i) => i.scheduled_date === dateStr);
    const dayPosts = posts.filter((p) => p.scheduled_date === dateStr);

    const bars = FORMATS
      .map((fmt) => {
        const fmtIdeas = dayIdeas.filter((i) => i.format === fmt);
        const fmtPosts = dayPosts.filter((p) => p.post_type === fmt);
        if (fmtIdeas.length === 0 && fmtPosts.length === 0) return null;

        const allDone = fmtPosts.length > 0 || (fmtIdeas.length > 0 && fmtIdeas.every((i) => i.status === "scheduled"));
        const someApproved = fmtIdeas.some((i) => i.status === "approved");

        return { format: fmt, opacity: allDone ? 1 : someApproved ? 0.5 : 0.15 };
      })
      .filter((b) => b !== null) as { format: string; opacity: number }[];

    cells.push({ date: dateStr, num: day, inMonth: true, isToday: dateStr === todayStr, bars });
  }

  // Pad remaining to complete last row
  const remaining = cells.length % 7;
  if (remaining > 0) {
    for (let i = 1; i <= 7 - remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d.toLocaleDateString("en-CA"), num: d.getDate(), inMonth: false, isToday: false, bars: [] });
    }
  }

  return cells;
}

function getMondayOfDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - offset);
  return monday.toLocaleDateString("en-CA");
}

export default function MonthGrid({ year, month, ideas, posts, selectedWeekStart, onSelectDay }: MonthGridProps) {
  const cells = useMemo(() => buildCalendarDays(year, month, ideas, posts), [year, month, ideas, posts]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center">
            <span
              className="text-[8px] tracking-[0.12em] uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              {h}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const inSelectedWeek = selectedWeekStart && getMondayOfDate(cell.date) === selectedWeekStart;
          const isSundayEmpty = new Date(cell.date + "T12:00:00").getDay() === 0 && cell.bars.length === 0 && cell.inMonth;

          return (
            <button
              key={cell.date}
              onClick={() => cell.inMonth && onSelectDay(cell.date)}
              disabled={!cell.inMonth}
              className="relative rounded-[10px] min-h-[90px] max-md:min-h-[70px] p-[8px_6px] text-center transition-all group"
              style={{
                background: inSelectedWeek ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.18)",
                backdropFilter: "blur(10px)",
                border: cell.isToday
                  ? "0.5px solid rgba(196,69,58,0.3)"
                  : inSelectedWeek
                    ? "0.5px solid rgba(168,183,142,0.4)"
                    : "0.5px solid rgba(168,183,142,0.08)",
                opacity: !cell.inMonth ? 0.25 : isSundayEmpty ? 0.35 : 1,
                pointerEvents: cell.inMonth ? "auto" : "none",
                cursor: cell.inMonth ? "pointer" : "default",
              }}
            >
              {/* Today top line */}
              {cell.isToday && (
                <div
                  className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "#C4453A" }}
                />
              )}

              {/* Day number */}
              <span
                className="text-[16px] max-md:text-[13px] font-[800] block"
                style={{ fontFamily: "var(--font-display)", lineHeight: 1 }}
              >
                {cell.num}
              </span>

              {/* Color bars */}
              {cell.bars.length > 0 && (
                <div className="flex flex-col gap-[2px] mt-2 transition-transform group-hover:scale-y-150">
                  {cell.bars.map((bar) => (
                    <div
                      key={bar.format}
                      className="h-[4px] rounded-[2px]"
                      style={{ background: FORMAT_COLORS[bar.format], opacity: bar.opacity }}
                    />
                  ))}
                </div>
              )}

              {/* Sunday rest */}
              {isSundayEmpty && (
                <span
                  className="text-[7px] mt-2 block"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
                >
                  rest
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
