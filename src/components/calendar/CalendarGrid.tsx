"use client";

import { useState, useMemo } from "react";
import CalendarBlock from "./CalendarBlock";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const DAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

interface CalendarCell {
  num: number;
  other: boolean;
  date: string;
  isToday: boolean;
}

interface CalendarGridProps {
  year: number;
  month: number;
  ideas: ScoredIdea[];
  selectedDay: string | null;
  onSelectDay: (date: string | null) => void;
  onDropIdea: (ideaId: string, date: string) => void;
  dragActive: boolean;
  onDragStart: (ideaId: string) => void;
  onDragEnd: () => void;
}

function buildCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const todayStr = new Date().toLocaleDateString("en-CA");
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: CalendarCell[] = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ num: prevLast - i, other: true, date: "", isToday: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ num: d, other: false, date: dateStr, isToday: dateStr === todayStr });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ num: next++, other: true, date: "", isToday: false });
  }
  return cells;
}

export default function CalendarGrid({ year, month, ideas, selectedDay, onSelectDay, onDropIdea, dragActive, onDragStart, onDragEnd }: CalendarGridProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  return (
    <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
      {/* Headers */}
      <div className="grid grid-cols-7" style={{ background: "rgba(255,255,255,0.04)" }}>
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center py-1.5">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>{h}</span>
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
        {cells.map((cell, idx) => {
          const cellIdeas = cell.date ? ideas.filter((i) => i.scheduled_date === cell.date) : [];
          const isSelected = selectedDay === cell.date;
          const isDropOver = dropTarget === cell.date;
          const isValidDrop = dragActive && !cell.other && cell.date;

          return (
            <div
              key={idx}
              onClick={() => !cell.other && cell.date && onSelectDay(isSelected ? null : cell.date)}
              onDragOver={(e) => {
                if (cell.other || !cell.date) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropTarget(cell.date);
              }}
              onDragEnter={(e) => {
                if (cell.other || !cell.date) return;
                e.preventDefault();
                setDropTarget(cell.date);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const ideaId = e.dataTransfer.getData("text/plain");
                if (ideaId && cell.date) onDropIdea(ideaId, cell.date);
              }}
              className="relative min-h-[48px] md:min-h-[88px] p-[3px_2px] md:p-[6px_5px] cursor-pointer transition-colors"
              style={{
                background: isDropOver
                  ? "var(--olive-bg)"
                  : isSelected
                    ? "var(--olive-bg)"
                    : "rgba(255,255,255,0.06)",
                outline: isDropOver
                  ? "2px dashed var(--olive)"
                  : isValidDrop
                    ? "1px dashed rgba(122,140,101,0.3)"
                    : isSelected
                      ? "1px solid rgba(122,140,101,0.3)"
                      : "none",
                outlineOffset: "-1px",
                opacity: cell.other ? 0.15 : 1,
                pointerEvents: cell.other ? "none" : "auto",
              }}
            >
              {/* Today line */}
              {cell.isToday && (
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "var(--red)" }} />
              )}

              {/* Shine */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)" }} />

              {/* Number */}
              <span
                className="relative z-[1] block text-center mb-0.5 md:mb-1 text-[10px] md:text-[11px]"
                style={{
                  fontFamily: cell.isToday ? "var(--font-display)" : undefined,
                  fontWeight: cell.isToday ? 700 : 500,
                  color: cell.isToday ? "var(--red)" : "var(--text-secondary)",
                }}
              >
                {cell.num}
              </span>

              {/* Idea blocks */}
              {cellIdeas.length > 0 && (
                <div className="relative z-[1] flex flex-col gap-[2px]">
                  {cellIdeas.slice(0, 4).map((idea) => (
                    <CalendarBlock key={idea.id} idea={idea} onDragStart={onDragStart} onDragEnd={onDragEnd} />
                  ))}
                  {cellIdeas.length > 4 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 6, color: "var(--text-ghost)" }}>+{cellIdeas.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
