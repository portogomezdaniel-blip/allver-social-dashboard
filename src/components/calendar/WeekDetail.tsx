"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import ContentBlock from "./ContentBlock";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DbPost } from "@/lib/supabase/posts";

interface WeekDay {
  date: string;
  name: string;
  num: number;
  isToday: boolean;
  isRest: boolean;
  inMonth: boolean;
}

interface WeekDetailProps {
  weekDays: WeekDay[];
  ideas: ScoredIdea[];
  posts: DbPost[];
  weekLabel: string;
  weekRange: string;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelectDate: (date: string) => void;
}

const FORMATS = ["reel", "carousel", "story", "single"] as const;

export default function WeekDetail({ weekDays, ideas, posts, weekLabel, weekRange, onClose, onApprove, onReject, onSelectDate }: WeekDetailProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [weekDays[0]?.date]);

  // Stats
  const weekIdeas = useMemo(() => {
    const dates = new Set(weekDays.map((d) => d.date));
    return ideas.filter((i) => i.scheduled_date && dates.has(i.scheduled_date));
  }, [weekDays, ideas]);

  const done = weekIdeas.filter((i) => i.status === "scheduled").length;
  const approved = weekIdeas.filter((i) => i.status === "approved").length;
  const pending = weekIdeas.filter((i) => i.status === "suggested").length;

  return (
    <div
      ref={ref}
      className="mt-3 rounded-[14px] p-4 animate-[fadeUp_0.3s_ease-out]"
      style={{
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(14px)",
        border: "0.5px solid rgba(168,183,142,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-[18px] font-[800] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {weekLabel}
          </h3>
          <span
            className="text-[10px]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            {weekRange}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-colors"
          style={{
            background: "rgba(0,0,0,0.12)",
            border: "0.5px solid rgba(168,183,142,0.08)",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          ✕
        </button>
      </div>

      {/* Day headers — desktop only */}
      <div className="hidden md:grid grid-cols-7 gap-[3px] mb-1">
        {weekDays.map((d) => (
          <div key={d.date + "-h"} className="text-center">
            <span
              className="text-[8px] tracking-[0.1em] uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              {d.name}
            </span>
          </div>
        ))}
      </div>

      {/* 7 columns — desktop: grid, mobile: stack */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-[3px]">
        {weekDays.map((day) => {
          const dayIdeas = ideas.filter((i) => i.scheduled_date === day.date);
          const dayPosts = posts.filter((p) => p.scheduled_date === day.date);
          const isRest = day.isRest && dayIdeas.length === 0 && dayPosts.length === 0;

          return (
            <div
              key={day.date}
              onClick={() => day.inMonth && onSelectDate(day.date)}
              className="rounded-[10px] p-[8px_6px] cursor-pointer group transition-colors hover:bg-[rgba(0,0,0,0.14)]"
              style={{
                background: "rgba(0,0,0,0.08)",
                border: day.isToday
                  ? "0.5px solid rgba(196,69,58,0.2)"
                  : "0.5px solid rgba(168,183,142,0.06)",
                minHeight: isRest ? 120 : 260,
                opacity: !day.inMonth ? 0.3 : 1,
              }}
            >
              {/* Day number + name (mobile) */}
              <div className="flex items-center gap-1.5 mb-2 md:block md:text-center">
                <span
                  className="text-[16px] font-[800]"
                  style={{ fontFamily: "var(--font-display)", lineHeight: 1 }}
                >
                  {day.num}
                </span>
                <span
                  className="text-[8px] md:hidden"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                >
                  {day.name}
                </span>
              </div>

              {isRest ? (
                <div className="flex items-center justify-center h-16">
                  <span
                    className="text-[9px]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
                  >
                    Descanso
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {FORMATS.map((fmt) => {
                    const fmtIdeas = dayIdeas.filter((i) => i.format === fmt);
                    const fmtPosts = dayPosts.filter((p) => p.post_type === fmt);
                    if (fmtIdeas.length === 0 && fmtPosts.length === 0) return null;

                    const blockKey = `${day.date}-${fmt}`;
                    const blockStatus = fmtPosts.length > 0 ? "scheduled"
                      : fmtIdeas.every((i) => i.status === "scheduled") ? "scheduled"
                      : fmtIdeas.some((i) => i.status === "approved") ? "approved"
                      : "suggested";

                    return (
                      <ContentBlock
                        key={blockKey}
                        format={fmt}
                        status={blockStatus}
                        ideas={fmtIdeas}
                        isExpanded={expandedBlock === blockKey}
                        onToggle={() => setExpandedBlock(expandedBlock === blockKey ? null : blockKey)}
                        onApprove={onApprove}
                        onReject={onReject}
                      />
                    );
                  })}
                </div>
              )}

              {/* "Ver día" hint on hover */}
              {day.inMonth && (
                <div className="mt-auto pt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
                    Ver dia →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {[
          { label: `${done} hechos`, color: "#A8B78E" },
          { label: `${approved} aprobados`, color: "#C8AA50" },
          { label: `${pending} pendientes`, color: "rgba(165,163,157,0.5)" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: s.color }} />
            <span
              className="text-[9px]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
