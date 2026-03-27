"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import TemperatureOrb from "@/components/mirror/TemperatureOrb";
import CommandDeck from "@/components/calendar/CommandDeck";
import DayDetail from "@/components/calendar/DayDetail";
import MoodEspejo from "@/components/calendar/MoodEspejo";
import YouTubeMission from "@/components/calendar/YouTubeMission";
import GlassCard from "@/components/mirror/GlassCard";
import { fetchWeekIdeas, fetchWeekJournals, fetchWeekTopNews, fetchWeekPosts, assignIdeaToDay, updateIdeaContent } from "@/lib/supabase/cockpit";
import { fetchLatestOutput, updateIdeaStatus } from "@/lib/supabase/program-output";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { JournalEntry } from "@/lib/supabase/journal";
import type { DailyNews } from "@/lib/supabase/daily-news";
import type { DbPost } from "@/lib/supabase/posts";

// ─── Week helpers ──────────────────────────────────────────
function getWeekRange(offset: number): { start: string; end: string; days: { date: string; dayNum: number; dayName: string; isToday: boolean }[] } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);

  const todayStr = today.toLocaleDateString("en-CA");
  const days: { date: string; dayNum: number; dayName: string; isToday: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA");
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayName: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][d.getDay()],
      isToday: dateStr === todayStr,
    });
  }

  return { start: days[0].date, end: days[6].date, days };
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} – ${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

// ─── Main Component ────────────────────────────────────────
export default function ContentCockpit() {
  const { t } = useLocale();

  // State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [weekIdeas, setWeekIdeas] = useState<ScoredIdea[]>([]);
  const [weekJournals, setWeekJournals] = useState<JournalEntry[]>([]);
  const [weekPosts, setWeekPosts] = useState<DbPost[]>([]);
  const [topNews, setTopNews] = useState<DailyNews | null>(null);
  const [temperature, setTemperature] = useState(5);
  const [loading, setLoading] = useState(true);

  // Computed week
  const week = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekLabel(week.start, week.end), [week.start, week.end]);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ideas, journals, news, posts, output] = await Promise.all([
        fetchWeekIdeas(week.start, week.end),
        fetchWeekJournals(week.start, week.end),
        fetchWeekTopNews(),
        fetchWeekPosts(week.start, week.end),
        fetchLatestOutput(),
      ]);
      setWeekIdeas(ideas);
      setWeekJournals(journals);
      setTopNews(news);
      setWeekPosts(posts);
      setTemperature(output?.temperature_score ?? 5);
    } catch {
      // Fallbacks already set
    } finally {
      setLoading(false);
    }
  }, [week.start, week.end]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived data for selected day
  const selectedDayIdeas = useMemo(
    () => selectedDay ? weekIdeas.filter((i) => i.scheduled_date === selectedDay) : [],
    [selectedDay, weekIdeas]
  );
  const selectedDayJournal = useMemo(
    () => selectedDay ? weekJournals.find((j) => j.entry_date === selectedDay) ?? null : null,
    [selectedDay, weekJournals]
  );
  const selectedDayPosts = useMemo(
    () => selectedDay ? weekPosts.filter((p) => p.scheduled_date === selectedDay) : [],
    [selectedDay, weekPosts]
  );
  const backlogIdeas = useMemo(
    () => weekIdeas.filter((i) => !i.scheduled_date && i.status === "suggested"),
    [weekIdeas]
  );

  // Latest journal for mood
  const latestJournal = useMemo(
    () => weekJournals.length > 0 ? weekJournals[weekJournals.length - 1] : null,
    [weekJournals]
  );

  // Week progress
  const weekProgress = useMemo(() => {
    const scheduled = weekIdeas.filter((i) => i.scheduled_date && i.status === "scheduled").length;
    const total = weekIdeas.filter((i) => i.scheduled_date).length;
    return { scheduled, total, pct: total > 0 ? Math.round((scheduled / total) * 100) : 0 };
  }, [weekIdeas]);

  // ─── Actions ─────────────────────────────────────────────
  function handleApproveIdea(ideaId: string) {
    if (!selectedDay) return;
    assignIdeaToDay(ideaId, selectedDay);
    setWeekIdeas((prev) =>
      prev.map((i) => i.id === ideaId ? { ...i, status: "approved", scheduled_date: selectedDay } : i)
    );
  }

  function handleRejectIdea(ideaId: string) {
    updateIdeaStatus(ideaId, "rejected");
    setWeekIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }

  function handleEditIdea(ideaId: string, updates: { hook?: string; description?: string }) {
    updateIdeaContent(ideaId, updates);
    setWeekIdeas((prev) =>
      prev.map((i) => i.id === ideaId ? { ...i, ...updates } : i)
    );
  }

  // ─── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[var(--text-muted)] text-sm">{t("calendar.loading")}</span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="pb-[180px] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[24px] font-[800] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("cockpit.title")}
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t("cockpit.subtitle")}
          </p>
        </div>
        <TemperatureOrb temperature={temperature} size="sm" />
      </div>

      {/* Mood Espejo */}
      <MoodEspejo
        temperature={temperature}
        mood={latestJournal?.mood ?? null}
      />

      {/* YouTube Mission */}
      <YouTubeMission
        topNews={topNews}
        temperature={temperature}
        journalMood={latestJournal?.mood ?? null}
        journalThemes={latestJournal?.themes ?? null}
      />

      {/* Week progress bar */}
      <GlassCard intensity="ghost" className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] tracking-[0.1em] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
            {t("cockpit.week_progress")}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
            {weekProgress.scheduled}/{weekProgress.total} · {weekProgress.pct}%
          </span>
        </div>
        <div className="w-full h-[4px] rounded-full" style={{ background: "rgba(0,0,0,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${weekProgress.pct}%`, background: "var(--middle)" }}
          />
        </div>
      </GlassCard>

      {/* Day Detail or empty state */}
      {selectedDay ? (
        <DayDetail
          date={selectedDay}
          ideas={selectedDayIdeas}
          journal={selectedDayJournal}
          posts={selectedDayPosts}
          backlogIdeas={backlogIdeas}
          onClose={() => setSelectedDay(null)}
          onApprove={handleApproveIdea}
          onReject={handleRejectIdea}
          onEdit={handleEditIdea}
        />
      ) : (
        <GlassCard intensity="ghost" className="py-12 text-center">
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {t("cockpit.select_day")}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-ghost)" }}>
            {t("cockpit.select_day_hint")}
          </p>
        </GlassCard>
      )}

      {/* Command Deck */}
      <CommandDeck
        weekDays={week.days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        weekIdeas={weekIdeas}
        weekPosts={weekPosts}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => o + 1)}
        weekLabel={weekLabel}
      />
    </div>
  );
}
