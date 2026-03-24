"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Platform, CalendarPost, platformConfig, calendarPosts as mockCalendarPosts } from "@/lib/mock-calendar";
import { fetchCalendarPosts } from "@/lib/supabase/calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { PlatformFilter } from "@/components/calendar/platform-filter";
import { GlowButton } from "@/components/ui/glow-button";
import { useLocale } from "@/lib/locale-context";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const allPlatforms: Platform[] = ["instagram", "youtube", "tiktok", "linkedin"];

export default function ContentCalendar() {
  const { t } = useLocale();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(allPlatforms);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const dbPosts = await fetchCalendarPosts();
      setPosts(dbPosts.length > 0 ? dbPosts : mockCalendarPosts);
    } catch {
      setPosts(mockCalendarPosts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () => posts.filter((p) => selectedPlatforms.includes(p.platform)),
    [selectedPlatforms, posts]
  );

  const monthPosts = useMemo(
    () =>
      filteredPosts.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [filteredPosts, year, month]
  );

  const scheduledCount = monthPosts.filter((p) => p.status === "scheduled").length;
  const publishedCount = monthPosts.filter((p) => p.status === "published").length;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); } else { setMonth(month - 1); }
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); } else { setMonth(month + 1); }
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const monthName = t(`calendar.${MONTH_KEYS[month]}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("calendar.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("calendar.subtitle")}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GlowButton onClick={prevMonth} className="px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </GlowButton>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {monthName} {year}
          </h2>
          <GlowButton onClick={nextMonth} className="px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </GlowButton>
          <GlowButton variant="ghost" onClick={goToday} className="px-4 py-1.5 text-[10px]">
            {t("calendar.today")}
          </GlowButton>
        </div>
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            {t("calendar.scheduled")}: <span className="text-foreground font-medium">{scheduledCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">
            {t("calendar.published")}: <span className="text-foreground font-medium">{publishedCount}</span>
          </span>
        </div>
        <div className="text-muted-foreground">
          {t("calendar.total")}: <span className="text-foreground font-medium">{monthPosts.length}</span>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("calendar.loading")}
          </div>
        </div>
      ) : (
        <CalendarGrid year={year} month={month} posts={monthPosts} />
      )}
    </div>
  );
}
