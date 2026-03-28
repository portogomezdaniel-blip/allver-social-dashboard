"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { fetchCalendarIdeas, assignIdeaToDay, moveIdeaToDay, unassignIdea, markIdeaDone, fetchTopNews } from "@/lib/supabase/cockpit";
import IdeaTray from "@/components/calendar/IdeaTray";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayPanel from "@/components/calendar/DayPanel";
import { Toast } from "@/components/ui/Toast";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ContentCalendar() {
  const { t } = useLocale();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [assigned, setAssigned] = useState<ScoredIdea[]>([]);
  const [unassigned, setUnassigned] = useState<ScoredIdea[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [topNews, setTopNews] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);

  const handleToastDone = useCallback(() => setToast(null), []);

  // Month range
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${lastDayNum}`;

  // Fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCalendarIdeas(monthStart, monthEnd),
      fetchTopNews(),
    ]).then(([{ assigned: a, unassigned: u }, news]) => {
      if (cancelled) return;
      setAssigned(a);
      setUnassigned(u);
      setTopNews(news);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [monthStart, monthEnd]);

  // Computed
  const selectedDayIdeas = useMemo(
    () => selectedDay ? assigned.filter((i) => i.scheduled_date === selectedDay) : [],
    [selectedDay, assigned]
  );

  const weekProgress = useMemo(() => {
    if (assigned.length === 0) return 0;
    const done = assigned.filter((i) => i.status === "scheduled").length;
    const approved = assigned.filter((i) => i.status === "approved").length;
    return Math.round(((done + approved * 0.5) / assigned.length) * 100);
  }, [assigned]);

  // ─── Drag handlers ────────────────────────────────────
  function handleDragStart(ideaId: string) {
    setDraggedIdeaId(ideaId);
    setDragActive(true);
  }

  function handleDragEnd() {
    setDraggedIdeaId(null);
    setDragActive(false);
  }

  function formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    const days = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
    return `${days[d.getDay()]} ${d.getDate()}`;
  }

  async function handleDropIdea(ideaId: string, date: string) {
    setDragActive(false);
    setDraggedIdeaId(null);

    const fromUnassigned = unassigned.find((i) => i.id === ideaId);
    const fromAssigned = assigned.find((i) => i.id === ideaId);
    const idea = fromUnassigned || fromAssigned;
    if (!idea) return;

    if (fromUnassigned) {
      setUnassigned((prev) => prev.filter((i) => i.id !== ideaId));
      setAssigned((prev) => [...prev, { ...idea, scheduled_date: date, status: "approved" }]);
      await assignIdeaToDay(ideaId, date);
      setToast(`Asignada al ${formatDayLabel(date)}`);
    } else {
      setAssigned((prev) => prev.map((i) => i.id === ideaId ? { ...i, scheduled_date: date } : i));
      await moveIdeaToDay(ideaId, date);
      setToast(`Movida al ${formatDayLabel(date)}`);
    }
    setSelectedDay(date);
  }

  async function handleMarkDone(ideaId: string) {
    setAssigned((prev) => prev.map((i) => i.id === ideaId ? { ...i, status: "scheduled" } : i));
    await markIdeaDone(ideaId);
    setToast("Marcado como hecho");
  }

  async function handleUnassign(ideaId: string) {
    const idea = assigned.find((i) => i.id === ideaId);
    if (!idea) return;
    setAssigned((prev) => prev.filter((i) => i.id !== ideaId));
    setUnassigned((prev) => [...prev, { ...idea, scheduled_date: null, status: "suggested" }].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)));
    await unassignIdea(ideaId);
    setToast("Idea devuelta a la bandeja");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast("Copiado al portapapeles");
  }

  function prevMonth() { setSelectedDay(null); if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
  function nextMonth() { setSelectedDay(null); if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }
  function goToday() { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); setSelectedDay(null); }

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-2 md:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-base md:text-[22px]" style={{ fontFamily: "var(--font-display)" }}>Calendario</h1>
        <p className="hidden md:block text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Arrastra ideas desde la bandeja o haz click en un dia.
        </p>
      </div>

      {/* Idea Tray */}
      <IdeaTray ideas={unassigned} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />

      {/* Month header + nav */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] md:text-[18px]" style={{ fontFamily: "var(--font-display)" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.08)]" style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>←</button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.08)]" style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>→</button>
          <button onClick={goToday} className="text-[9px] px-2.5 py-1 rounded-full transition-colors hover:bg-[rgba(255,255,255,0.08)]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {t("calendar.today")}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
        {[
          { color: "var(--red)", label: "Reel" },
          { color: "var(--olive)", label: "Carrusel" },
          { color: "var(--blue)", label: "Stories" },
          { color: "var(--purple)", label: "Post" },
        ].map((f) => (
          <span key={f.label} className="flex items-center gap-1 whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "rgba(255,255,255,0.4)" }}>
            <span className="w-1.5 h-1.5 rounded-sm" style={{ background: f.color }} /> {f.label}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "rgba(255,255,255,0.3)" }}>
          {assigned.filter((i) => i.status === "scheduled").length}/{assigned.length}
        </span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weekProgress}%`, background: "linear-gradient(90deg, #5C6B4A, #93A87A)" }} />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "var(--olive)" }}>{weekProgress}%</span>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-[var(--text-muted)] text-sm">{t("calendar.loading")}</span>
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          ideas={assigned}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onDropIdea={handleDropIdea}
          dragActive={dragActive}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Day Panel */}
      {selectedDay && (
        <DayPanel
          date={selectedDay}
          ideas={selectedDayIdeas}
          onClose={() => setSelectedDay(null)}
          onMarkDone={handleMarkDone}
          onUnassign={handleUnassign}
          onCopy={handleCopy}
        />
      )}

      {/* YouTube bar */}
      {topNews && (
        <div className="flex items-center gap-2.5 p-3 px-4 rounded-[8px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderLeft: "3px solid var(--red)" }}>
          <div className="w-5 h-4 rounded-[2px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--red)" }}>
            <div className="w-0 h-0" style={{ borderLeft: "5px solid white", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }} />
          </div>
          <span className="text-[12px] flex-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
            <strong>{t("calendar.yt_week") || "YouTube esta semana"}:</strong> {topNews.title}
          </span>
          <span className="text-[8px] px-2 py-0.5 rounded-[5px] flex-shrink-0" style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}>
            pendiente
          </span>
        </div>
      )}

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}
