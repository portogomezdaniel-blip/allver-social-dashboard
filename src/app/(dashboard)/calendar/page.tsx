"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Platform, CalendarPost } from "@/lib/mock-calendar";
import { fetchCalendarPosts } from "@/lib/supabase/calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { useLocale } from "@/lib/locale-context";
import GlassCard from "@/components/mirror/GlassCard";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const allPlatforms: Platform[] = ["instagram", "youtube", "tiktok", "linkedin"];
// Format colors for future use when post_type is available on calendar posts

export default function ContentCalendar() {
  const { t } = useLocale();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedPlatforms] = useState<Platform[]>(allPlatforms);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try { setPosts(await fetchCalendarPosts()); } catch { setPosts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const filteredPosts = useMemo(() => posts.filter((p) => selectedPlatforms.includes(p.platform)), [selectedPlatforms, posts]);
  const monthPosts = useMemo(() => filteredPosts.filter((p) => { const d = new Date(p.date); return d.getFullYear() === year && d.getMonth() === month; }), [filteredPosts, year, month]);

  const totalPosts = monthPosts.length;

  function prevMonth() { if (month === 0) { setMonth(11); setYear(year - 1); } else { setMonth(month - 1); } }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(year + 1); } else { setMonth(month + 1); } }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  const monthName = t(`calendar.${MONTH_KEYS[month]}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[24px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Tu ritmo</h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">El patron de tu presencia digital</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1">&larr;</button>
        <h2 className="text-[16px] font-[800] min-w-[180px] text-center" style={{ fontFamily: "var(--font-display)" }}>{monthName} {year}</h2>
        <button onClick={nextMonth} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1">&rarr;</button>
        <button onClick={goToday} className="text-[9px] px-2 py-1 rounded-md text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-secondary)]">Hoy</button>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-[11px]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--olive)]" />Programados: <strong>{monthPosts.filter(p => p.status === "scheduled").length}</strong></span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--blue)]" />Publicados: <strong>{monthPosts.filter(p => p.status === "published").length}</strong></span>
        <span className="text-[var(--text-muted)]">Total: <strong>{monthPosts.length}</strong></span>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">...</div>
      ) : (
        <GlassCard intensity="subtle" className="p-3 overflow-x-auto">
          <CalendarGrid year={year} month={month} posts={monthPosts} />
        </GlassCard>
      )}
    </div>
  );
}
