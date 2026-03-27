"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

interface DeckDay {
  name: string;
  num: number;
  date: string;
  isToday: boolean;
  reels: ScoredIdea[];
  carousels: ScoredIdea[];
  stories: ScoredIdea[];
}

interface CommandDeckProps {
  days: DeckDay[];
  selectedDay: string | null;
  onSelectDay: (date: string | null) => void;
}

function blockOpacity(ideas: ScoredIdea[]): number {
  if (ideas.length === 0) return 0;
  if (ideas.every((i) => i.status === "scheduled")) return 1.0;
  if (ideas.some((i) => i.status === "approved")) return 0.6;
  return 0.2;
}

export default function CommandDeck({ days, selectedDay, onSelectDay }: CommandDeckProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: "rgba(18,18,18,0.95)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-[720px] mx-auto">
        {/* 7 day columns */}
        <div className="flex px-2 pt-2 pb-1">
          {days.map((day) => {
            const isSelected = selectedDay === day.date;
            const reelOp = blockOpacity(day.reels);
            const carouselOp = blockOpacity(day.carousels);
            const storyOp = blockOpacity(day.stories);

            return (
              <button
                key={day.date}
                onClick={() => onSelectDay(isSelected ? null : day.date)}
                className="flex-1 flex flex-col items-center py-2 rounded-[8px] transition-all group"
                style={{
                  background: isSelected ? "rgba(168,183,142,0.08)" : "transparent",
                }}
              >
                {/* Today / selected indicator */}
                {day.isToday && (
                  <div
                    className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "#C4453A", boxShadow: "0 0 8px rgba(196,69,58,0.4)" }}
                  />
                )}
                {isSelected && !day.isToday && (
                  <div
                    className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "#A8B78E" }}
                  />
                )}

                {/* Day name */}
                <span
                  className="text-[8px] tracking-[0.1em] uppercase"
                  style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}
                >
                  {day.name}
                </span>

                {/* Day number */}
                <span
                  className="text-[20px] max-[480px]:text-[16px] font-[800] leading-none mt-0.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: isSelected ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {day.num}
                </span>

                {/* Color blocks */}
                <div className="flex flex-col gap-[2px] mt-1.5 w-[80%] transition-transform group-hover:scale-y-150">
                  {reelOp > 0 && (
                    <div
                      className="h-[4px] rounded-[2px] transition-opacity"
                      style={{ background: "#C4453A", opacity: reelOp }}
                    />
                  )}
                  {carouselOp > 0 && (
                    <div
                      className="h-[4px] rounded-[2px] transition-opacity"
                      style={{ background: "#A8B78E", opacity: carouselOp }}
                    />
                  )}
                  {storyOp > 0 && (
                    <div
                      className="h-[4px] rounded-[2px] transition-opacity"
                      style={{ background: "#6B8CBA", opacity: storyOp }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pb-3 pb-safe">
          {[
            { color: "#C4453A", label: "Reel" },
            { color: "#A8B78E", label: "Carrusel" },
            { color: "#6B8CBA", label: "Stories" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className="w-2 h-[4px] rounded-[1px]" style={{ background: item.color }} />
              <span className="text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.2)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
