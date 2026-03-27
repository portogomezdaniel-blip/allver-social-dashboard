"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import { fetchWeekIdeas, fetchWeekPosts, fetchWeekTopNews, approveIdea, assignIdeaToDay } from "@/lib/supabase/cockpit";
import { fetchLatestOutput, updateIdeaStatus } from "@/lib/supabase/program-output";
import { createPost } from "@/lib/supabase/posts";
import CommandDeck from "@/components/calendar/CommandDeck";
import DayDetail from "@/components/calendar/DayDetail";
import GlassCard from "@/components/mirror/GlassCard";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DbPost } from "@/lib/supabase/posts";
import type { DailyNews } from "@/lib/supabase/daily-news";

// ─── Week calculation ──────────────────────────────────────
function getWeekDates(offset: number) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const dayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA");
    return {
      date: dateStr,
      name: dayNames[i],
      num: d.getDate(),
      label: d.toLocaleDateString("es", { month: "short", day: "numeric" }),
      isToday: dateStr === todayStr,
    };
  });

  return {
    start: days[0].date,
    end: days[6].date,
    days,
  };
}

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

// ─── Main Component ────────────────────────────────────────
export default function ContentCalendar() {
  const { t } = useLocale();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ScoredIdea[]>([]);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [topNews, setTopNews] = useState<DailyNews | null>(null);
  const [temperature, setTemperature] = useState(5);
  const [loading, setLoading] = useState(true);

  const week = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = `Semana ${getWeekNumber(week.start)}`;
  const tempLabel = temperature >= 7 ? "En llamas" : temperature >= 4 ? "Estable" : "Reflexivo";

  // Fetch data on week change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchWeekIdeas(week.start, week.end),
      fetchWeekPosts(week.start, week.end),
      fetchWeekTopNews(),
      fetchLatestOutput().catch(() => null),
    ]).then(([i, p, n, o]) => {
      if (cancelled) return;
      setIdeas(i);
      setPosts(p);
      setTopNews(n);
      if (o?.temperature_score) setTemperature(o.temperature_score);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [week.start, week.end]);

  // Computed: ideas for selected day
  const dayIdeas = useMemo(
    () => selectedDay ? ideas.filter((i) => i.scheduled_date === selectedDay) : [],
    [selectedDay, ideas]
  );
  const unassigned = useMemo(
    () => ideas.filter((i) => !i.scheduled_date && i.status === "suggested"),
    [ideas]
  );

  // Computed: deck days with format buckets
  const deckDays = useMemo(
    () => week.days.map((d) => {
      const di = ideas.filter((i) => i.scheduled_date === d.date);
      return {
        ...d,
        reels: di.filter((i) => i.format === "reel"),
        carousels: di.filter((i) => i.format === "carousel"),
        stories: di.filter((i) => i.format === "story" || i.format === "single"),
      };
    }),
    [week.days, ideas]
  );

  // Selected day metadata
  const selectedDayInfo = useMemo(
    () => week.days.find((d) => d.date === selectedDay),
    [week.days, selectedDay]
  );

  // ─── Handlers ──────────────────────────────────────────
  async function handleApprove(id: string) {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status: "approved" } : i));
    await approveIdea(id);
  }

  async function handleReject(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    await updateIdeaStatus(id, "rejected");
  }

  async function handleCreatePost(idea: ScoredIdea) {
    const date = idea.scheduled_date || selectedDay || new Date().toLocaleDateString("en-CA");
    const postType = idea.format === "carousel" ? "carousel" : idea.format === "story" ? "story" : idea.format === "single" ? "single" : "reel";

    setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, status: "scheduled" } : i));

    await createPost({
      caption: idea.hook + "\n\n" + (idea.description || ""),
      post_type: postType as "carousel" | "reel" | "single" | "story",
      status: "scheduled",
      scheduled_date: date,
      platform: "instagram",
    });
    await updateIdeaStatus(idea.id, "scheduled", date);
  }

  async function handleAssign(id: string) {
    if (!selectedDay) return;
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, scheduled_date: selectedDay, status: "approved" } : i));
    await assignIdeaToDay(id, selectedDay);
  }

  // ─── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[var(--text-muted)] text-sm">{t("calendar.loading")}</span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="pb-[160px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-[22px] font-[800] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {weekLabel}
          </h1>
          <p
            className="text-[10px] mt-0.5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            {week.days[0].label} – {week.days[6].label}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="text-[9px] px-2.5 py-1 rounded-xl"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(168,183,142,0.08)",
              border: "0.5px solid rgba(168,183,142,0.15)",
              color: "var(--middle)",
            }}
          >
            {temperature.toFixed(1)} · {tempLabel}
          </span>
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1.5 py-1"
          >
            ←
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1.5 py-1"
          >
            →
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-[9px] px-2 py-1 rounded-md transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              border: "0.5px solid var(--border)",
            }}
          >
            Hoy
          </button>
        </div>
      </div>

      {/* YouTube suggestion */}
      {topNews && (
        <GlassCard intensity="ghost" className="p-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-4 rounded-[2px] flex items-center justify-center flex-shrink-0"
              style={{ background: "#C4453A" }}
            >
              <div
                className="w-0 h-0"
                style={{ borderLeft: "5px solid white", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }}
              />
            </div>
            <span className="text-[12px] flex-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
              <strong>YouTube esta semana:</strong> {topNews.title}
            </span>
            <span
              className="text-[8px] px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", background: "rgba(196,69,58,0.12)", color: "var(--surface)" }}
            >
              pendiente
            </span>
          </div>
        </GlassCard>
      )}

      {/* Day detail or empty state */}
      {selectedDay && selectedDayInfo ? (
        <DayDetail
          date={selectedDay}
          dayName={selectedDayInfo.name}
          dayNum={selectedDayInfo.num}
          dateLabel={selectedDayInfo.label}
          ideas={dayIdeas}
          unassigned={unassigned}
          onClose={() => setSelectedDay(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onCreatePost={handleCreatePost}
          onAssign={handleAssign}
        />
      ) : (
        <div className="text-center py-16">
          <p
            className="text-[16px] font-[800]"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}
          >
            Tu semana
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-ghost)" }}>
            Selecciona un dia abajo para ver que publicar
          </p>
        </div>
      )}

      {/* Command Deck */}
      <CommandDeck
        days={deckDays}
        selectedDay={selectedDay}
        onSelectDay={(date) => setSelectedDay(date)}
      />
    </div>
  );
}
