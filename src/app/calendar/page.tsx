"use client";

import { useState, useMemo } from "react";
import { Platform, calendarPosts, platformConfig } from "@/lib/mock-calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { PlatformFilter } from "@/components/calendar/platform-filter";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const allPlatforms: Platform[] = ["instagram", "youtube", "tiktok", "linkedin"];

export default function ContentCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(2); // March (0-indexed)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(allPlatforms);

  const filteredPosts = useMemo(
    () => calendarPosts.filter((p) => selectedPlatforms.includes(p.platform)),
    [selectedPlatforms]
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
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista mensual del contenido programado y publicado en todas las plataformas.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevMonth} className="border-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth} className="border-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-primary text-xs">
            Hoy
          </Button>
        </div>

        {/* Platform filter */}
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            Programados: <span className="text-foreground font-medium">{scheduledCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">
            Publicados: <span className="text-foreground font-medium">{publishedCount}</span>
          </span>
        </div>
        <div className="text-muted-foreground">
          Total: <span className="text-foreground font-medium">{monthPosts.length}</span>
        </div>
      </div>

      {/* Calendar grid */}
      <CalendarGrid year={year} month={month} posts={monthPosts} />
    </div>
  );
}
