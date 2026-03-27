"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import { fetchMonthIdeas, fetchMonthPosts, fetchTopNews, fetchDayNews, approveIdea } from "@/lib/supabase/cockpit";
import { updateIdeaStatus } from "@/lib/supabase/program-output";
import MonthGrid from "@/components/calendar/MonthGrid";
import WeekDetail from "@/components/calendar/WeekDetail";
import DayView from "@/components/calendar/DayView";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DbPost } from "@/lib/supabase/posts";
import type { DailyNews } from "@/lib/supabase/daily-news";

// ─── Month names ───────────────────────────────────────────
const MONTH_NAMES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

// ─── Week helpers ──────────────────────────────────────────
function getMondayOfDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - offset);
  return monday.toLocaleDateString("en-CA");
}

function getWeekFromMonday(mondayStr: string, currentMonth: number, currentYear: number) {
  const monday = new Date(mondayStr + "T12:00:00");
  const dayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const todayStr = new Date().toLocaleDateString("en-CA");

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = d.toLocaleDateString("en-CA");
    return {
      date: dateKey,
      name: dayNames[i],
      num: d.getDate(),
      isToday: dateKey === todayStr,
      isRest: i === 6,
      inMonth: d.getMonth() === currentMonth && d.getFullYear() === currentYear,
    };
  });

  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const lastDay = days[6];
  const range = `${days[0].name} ${days[0].num} – ${lastDay.name} ${lastDay.num}`;

  return { days, label: `Semana ${weekNum}`, range };
}

// ─── Main Component ────────────────────────────────────────
export default function ContentCalendar() {
  const { t, locale } = useLocale();
  const monthNames = locale === "en" ? MONTH_NAMES_EN : MONTH_NAMES_ES;

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ScoredIdea[]>([]);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [topNews, setTopNews] = useState<DailyNews | null>(null);
  const [dayNews, setDayNews] = useState<DailyNews[]>([]);
  const [loading, setLoading] = useState(true);

  // Month range
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${lastDayNum}`;

  // Fetch on month change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchMonthIdeas(monthStart, monthEnd),
      fetchMonthPosts(monthStart, monthEnd),
      fetchTopNews(),
    ]).then(([i, p, n]) => {
      if (cancelled) return;
      setIdeas(i);
      setPosts(p);
      setTopNews(n);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [monthStart, monthEnd]);

  // Fetch day news when a day is selected
  useEffect(() => {
    if (selectedDate) {
      fetchDayNews(selectedDate).then(setDayNews).catch(() => setDayNews([]));
    }
  }, [selectedDate]);

  // Week data for expansion
  const selectedWeek = useMemo(
    () => selectedWeekStart ? getWeekFromMonday(selectedWeekStart, month, year) : null,
    [selectedWeekStart, month, year]
  );

  // Day view data
  const dayViewData = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate + "T12:00:00");
    return {
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      ideas: ideas.filter((i) => i.scheduled_date === selectedDate),
      posts: posts.filter((p) => p.scheduled_date === selectedDate),
    };
  }, [selectedDate, ideas, posts]);

  // ─── Handlers ──────────────────────────────────────────
  function handleSelectDay(dateStr: string) {
    const mondayStr = getMondayOfDate(dateStr);
    setSelectedWeekStart((prev) => prev === mondayStr ? null : mondayStr);
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
  }

  function handleBackFromDay() {
    setSelectedDate(null);
  }

  function prevMonth() {
    setSelectedWeekStart(null);
    setSelectedDate(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    setSelectedWeekStart(null);
    setSelectedDate(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedWeekStart(null);
    setSelectedDate(null);
  }

  async function handleApprove(id: string) {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status: "approved" } : i));
    await approveIdea(id);
  }

  async function handleReject(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    await updateIdeaStatus(id, "rejected");
  }

  // ─── Render ──────────────────────────────────────────

  // DAY VIEW — full day detail
  if (selectedDate && dayViewData) {
    return (
      <div>
        <DayView
          date={selectedDate}
          dayName={dayViewData.dayName}
          dayNum={dayViewData.dayNum}
          monthLabel={`${monthNames[month]} ${year}`}
          ideas={dayViewData.ideas}
          news={dayNews}
          posts={dayViewData.posts}
          onBack={handleBackFromDay}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    );
  }

  // MONTH VIEW — grid + week expansion
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-[24px] font-[800] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {monthNames[month]} {year}
          </h1>
          <p
            className="text-[10px] mt-0.5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            Q{Math.ceil((month + 1) / 3)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1.5 py-1">←</button>
          <button onClick={nextMonth} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-[12px] px-1.5 py-1">→</button>
          <button
            onClick={goToday}
            className="text-[9px] px-2 py-1 rounded-md transition-colors"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", border: "0.5px solid var(--border)" }}
          >
            {t("calendar.today")}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex gap-4 flex-wrap mb-4 p-2.5 px-4 rounded-xl"
        style={{ background: "rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", border: "0.5px solid rgba(168,183,142,0.08)" }}
      >
        {[
          { color: "#C4453A", label: "Reel" },
          { color: "#A8B78E", label: "Carrusel" },
          { color: "#6B8CBA", label: "Stories" },
          { color: "#9B7EB8", label: "Post" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <div className="w-[8px] h-[4px] rounded-[2px]" style={{ background: f.color }} />
            <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{f.label}</span>
          </div>
        ))}
        <span className="text-[8px] mx-1" style={{ color: "var(--border)" }}>|</span>
        {[
          { color: "#A8B78E", label: t("calendar.done") || "Hecho" },
          { color: "#C8AA50", label: t("calendar.approved") || "Aprobado" },
          { color: "rgba(165,163,157,0.5)", label: t("calendar.pending") || "Pendiente" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: s.color }} />
            <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Month Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-[var(--text-muted)] text-sm">{t("calendar.loading")}</span>
        </div>
      ) : (
        <MonthGrid
          year={year}
          month={month}
          ideas={ideas}
          posts={posts}
          selectedWeekStart={selectedWeekStart}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* Week Detail */}
      {selectedWeekStart && selectedWeek && (
        <WeekDetail
          weekDays={selectedWeek.days}
          ideas={ideas}
          posts={posts}
          weekLabel={selectedWeek.label}
          weekRange={selectedWeek.range}
          onClose={() => setSelectedWeekStart(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelectDate={handleSelectDate}
        />
      )}

      {/* YouTube suggestion */}
      {topNews && (
        <div
          className="mt-4 flex items-center gap-2.5 p-3 px-4 rounded-xl"
          style={{ background: "rgba(0,0,0,0.06)", border: "0.5px solid rgba(168,183,142,0.08)" }}
        >
          <div className="w-5 h-4 rounded-[2px] flex items-center justify-center flex-shrink-0" style={{ background: "#C4453A" }}>
            <div className="w-0 h-0" style={{ borderLeft: "5px solid white", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }} />
          </div>
          <span className="text-[12px] flex-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
            <strong>{t("calendar.yt_week") || "YouTube esta semana"}:</strong> {topNews.title}
          </span>
          <span className="text-[8px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: "var(--font-mono)", background: "rgba(196,69,58,0.12)", color: "#C4453A" }}>
            pendiente
          </span>
        </div>
      )}
    </div>
  );
}
