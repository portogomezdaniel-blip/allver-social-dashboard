"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DbPost } from "@/lib/supabase/posts";

interface CommandDeckProps {
  weekDays: { date: string; dayNum: number; dayName: string; isToday: boolean }[];
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
  weekIdeas: ScoredIdea[];
  weekPosts: DbPost[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  weekLabel: string;
}

const SHORT_DAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

function getDayContent(date: string, ideas: ScoredIdea[], posts: DbPost[]) {
  const dayIdeas = ideas.filter((i) => i.scheduled_date === date);
  const dayPosts = posts.filter((p) => p.scheduled_date === date);

  const hasReels = dayIdeas.some((i) => i.format === "reel") || dayPosts.some((p) => p.post_type === "reel");
  const hasCarousels = dayIdeas.some((i) => i.format === "carousel") || dayPosts.some((p) => p.post_type === "carousel");
  const hasStories = dayIdeas.some((i) => i.format === "story" || i.format === "single") || dayPosts.some((p) => p.post_type === "story" || p.post_type === "single");

  const reelComplete = dayIdeas.filter((i) => i.format === "reel").every((i) => i.status === "scheduled");
  const carouselComplete = dayIdeas.filter((i) => i.format === "carousel").every((i) => i.status === "scheduled");
  const storyComplete = dayIdeas.filter((i) => i.format === "story" || i.format === "single").every((i) => i.status === "scheduled");

  return {
    reelOpacity: hasReels ? (reelComplete ? 1.0 : 0.7) : 0.2,
    carouselOpacity: hasCarousels ? (carouselComplete ? 1.0 : 0.7) : 0.2,
    storyOpacity: hasStories ? (storyComplete ? 1.0 : 0.7) : 0.2,
  };
}

export default function CommandDeck({ weekDays, selectedDay, onSelectDay, weekIdeas, weekPosts, onPrevWeek, onNextWeek, weekLabel }: CommandDeckProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: "rgba(18,18,18,0.95)",
        backdropFilter: "blur(24px)",
        borderTop: "0.5px solid rgba(168,183,142,0.08)",
      }}
    >
      {/* Week nav */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <button onClick={onPrevWeek} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1">←</button>
        <span className="text-[9px] tracking-[0.1em] uppercase font-mono" style={{ color: "var(--text-muted)" }}>{weekLabel}</span>
        <button onClick={onNextWeek} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1">→</button>
      </div>

      {/* 7 day columns */}
      <div className="flex px-2 pb-2 gap-1">
        {weekDays.map((day, i) => {
          const isSelected = selectedDay === day.date;
          const content = getDayContent(day.date, weekIdeas, weekPosts);

          return (
            <button
              key={day.date}
              onClick={() => onSelectDay(day.date)}
              className="flex-1 flex flex-col items-center py-2 rounded-[8px] transition-all relative"
              style={{
                background: isSelected ? "rgba(168,183,142,0.08)" : "transparent",
              }}
            >
              {/* Today indicator — red glow line */}
              {day.isToday && (
                <div
                  className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "var(--surface)", boxShadow: "0 0 6px rgba(196,69,58,0.5)" }}
                />
              )}
              {/* Selected indicator — olive line */}
              {isSelected && !day.isToday && (
                <div
                  className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "var(--middle)" }}
                />
              )}

              {/* Day name */}
              <span className="text-[8px] tracking-[0.1em] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
                {SHORT_DAYS[i]}
              </span>

              {/* Day number */}
              <span
                className="text-[22px] sm:text-[22px] text-[18px] font-[800] leading-none mt-0.5"
                style={{ fontFamily: "var(--font-display)", color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {day.dayNum}
              </span>

              {/* 3 color blocks */}
              <div className="flex flex-col gap-[2px] mt-1.5 w-full px-1.5">
                <div
                  className="h-[5px] rounded-[2px] transition-opacity"
                  style={{ background: "var(--surface)", opacity: content.reelOpacity }}
                />
                <div
                  className="h-[5px] rounded-[2px] transition-opacity"
                  style={{ background: "var(--middle)", opacity: content.carouselOpacity }}
                />
                <div
                  className="h-[5px] rounded-[2px] transition-opacity"
                  style={{ background: "var(--conversion)", opacity: content.storyOpacity }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pb-3 pb-safe">
        {[
          { color: "var(--surface)", label: "Superficie · Filtra" },
          { color: "var(--middle)", label: "Medio · Autoridad" },
          { color: "var(--conversion)", label: "Conversion" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2 h-[4px] rounded-[1px]" style={{ background: item.color }} />
            <span className="text-[7px] font-mono" style={{ color: "var(--text-ghost)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
