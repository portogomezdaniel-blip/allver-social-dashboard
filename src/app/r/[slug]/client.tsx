"use client";

import { useState } from "react";

interface Exercise {
  id?: string;
  name: string;
  sets: string;
  reps: string;
  rpe: string;
  weight: string;
  rest: string;
  notes: string;
}

interface Day {
  id?: string;
  name: string;
  exercises: Exercise[];
}

interface Program {
  client_name: string;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  general_notes: string | null;
  resources: string | null;
  program_json: { days: Day[] };
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "numeric", month: "long" }).toUpperCase();
  return `${fmt(s)} – ${fmt(e)} ${e.getFullYear()}`;
}

function isBiserie(name: string) {
  return name.toUpperCase().startsWith("BISERIE:");
}

function isPrincipal(index: number) {
  return index === 0;
}

function parseRestSeconds(rest: string): number {
  if (!rest) return 120;
  const parts = rest.split(":");
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return parseInt(rest) || 120;
}

function estimateSessionTime(exercises: Exercise[]): string {
  let totalSets = 0;
  let totalRest = 0;
  for (const ex of exercises) {
    const sets = parseInt(ex.sets) || 0;
    totalSets += sets;
    totalRest += sets * parseRestSeconds(ex.rest);
  }
  const workTime = totalSets * 45;
  const total = Math.round((totalRest + workTime) / 60);
  return `~${total} min`;
}

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#FF6B35] underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function isYouTubeUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function PublicRoutineClient({ program }: { program: Program }) {
  const days = program.program_json?.days || [];
  const [activeDay, setActiveDay] = useState(0);
  const currentDay = days[activeDay];

  const totalSets = currentDay?.exercises.reduce(
    (acc, ex) => acc + (parseInt(ex.sets) || 0),
    0
  ) || 0;

  const avgRpe =
    currentDay?.exercises.filter((e) => e.rpe).length > 0
      ? (
          currentDay.exercises.reduce((acc, e) => acc + (parseFloat(e.rpe) || 0), 0) /
          currentDay.exercises.filter((e) => e.rpe).length
        ).toFixed(1)
      : "—";

  const resourceLines = (program.resources || "").split("\n").filter(Boolean);
  const youtubeVideos = resourceLines
    .map((l) => ({ line: l.trim(), videoId: isYouTubeUrl(l.trim()) }))
    .filter((v) => v.videoId);
  const textResources = resourceLines.filter((l) => !isYouTubeUrl(l.trim()));

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0A0A08",
        color: "#F5F5F0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
      <header className="px-5 pt-8 pb-6" style={{ borderBottom: "1px solid #1A1918" }}>
        <p
          className="text-[10px] tracking-[0.2em] uppercase mb-4"
          style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}
        >
          FTP by LLVR
        </p>
        <h1
          className="text-[28px] leading-tight tracking-tight"
          style={{
            fontFamily: "'Barlow Condensed', 'Inter', sans-serif",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          {program.client_name || "PROGRAMA"}
        </h1>
        {(program.period_start || program.period_end) && (
          <p
            className="text-[11px] mt-2 tracking-[0.05em]"
            style={{ color: "#FF6B35", fontFamily: "monospace" }}
          >
            {formatPeriod(program.period_start, program.period_end)}
          </p>
        )}
        {program.period_label && (
          <p
            className="text-[14px] mt-2 tracking-[0.02em]"
            style={{
              color: "#AAA",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {program.period_label}
          </p>
        )}
        {program.general_notes && (
          <p className="text-[12px] mt-4 leading-relaxed" style={{ color: "#888" }}>
            {program.general_notes}
          </p>
        )}
      </header>

      {/* DAY TABS */}
      <nav className="flex gap-2 px-5 py-4 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        {days.map((day, idx) => (
          <button
            key={day.id || idx}
            onClick={() => setActiveDay(idx)}
            className="flex-shrink-0 px-4 py-2 text-[11px] tracking-[0.05em] uppercase transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              borderRadius: "6px",
              background: activeDay === idx ? "#FF6B35" : "#111110",
              color: activeDay === idx ? "#000" : "#AAA",
              border: `1px solid ${activeDay === idx ? "#FF6B35" : "#1A1918"}`,
            }}
          >
            Día {idx + 1}
            <span
              className="block text-[9px] mt-0.5"
              style={{
                fontWeight: 400,
                opacity: 0.7,
                textTransform: "none",
              }}
            >
              {day.name}
            </span>
          </button>
        ))}
      </nav>

      {/* EXERCISES */}
      {currentDay && (
        <section className="px-5 pb-6 space-y-3">
          {currentDay.exercises.map((ex, idx) => {
            const biserie = isBiserie(ex.name);
            const principal = isPrincipal(idx) && !biserie;

            return (
              <div
                key={ex.id || idx}
                className="p-4"
                style={{
                  background: "#111110",
                  borderRadius: "10px",
                  border: "1px solid #1A1918",
                  borderLeft: biserie
                    ? "3px solid #FF9F1C"
                    : principal
                    ? "3px solid #FF6B35"
                    : "1px solid #1A1918",
                }}
              >
                {/* Exercise header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {biserie && (
                      <span className="text-[12px]">&#9889;</span>
                    )}
                    <h3
                      className="text-[13px]"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#F5F5F0",
                      }}
                    >
                      {biserie ? ex.name.replace(/^BISERIE:\s*/i, "") : ex.name}
                    </h3>
                  </div>
                  {principal && (
                    <span
                      className="text-[8px] tracking-[0.1em] uppercase px-2 py-0.5"
                      style={{
                        background: "rgba(255,107,53,0.15)",
                        color: "#FF6B35",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      Principal
                    </span>
                  )}
                  {biserie && (
                    <span
                      className="text-[8px] tracking-[0.1em] uppercase px-2 py-0.5"
                      style={{
                        background: "rgba(255,159,28,0.15)",
                        color: "#FF9F1C",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      Biserie
                    </span>
                  )}
                </div>

                {/* Exercise data */}
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {(ex.sets || ex.reps) && (
                    <p style={{ fontFamily: "monospace", fontSize: "14px", color: "#F5F5F0" }}>
                      {ex.sets && <span>{ex.sets} &times; </span>}
                      {ex.reps && <span>{ex.reps}</span>}
                      {ex.rpe && (
                        <span style={{ color: "#AAA" }}> @RPE {ex.rpe}</span>
                      )}
                      {ex.weight && (
                        <span style={{ color: "#AAA" }}> &middot; {ex.weight}kg</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Rest */}
                {ex.rest && (
                  <p className="mt-1.5 text-[11px]" style={{ color: "#666" }}>
                    &#9201; Descanso: {ex.rest}
                  </p>
                )}

                {/* Notes */}
                {ex.notes && (
                  <p className="mt-1 text-[11px]" style={{ color: "#888" }}>
                    &#128221; {ex.notes}
                  </p>
                )}
              </div>
            );
          })}

          {/* DAY SUMMARY */}
          <div
            className="mt-4 p-4 grid grid-cols-4 gap-2 text-center"
            style={{
              background: "#0D0D0B",
              borderRadius: "10px",
              border: "1px solid #1A1918",
            }}
          >
            <div>
              <p style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "#F5F5F0" }}>
                {currentDay.exercises.length}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#666" }}>
                Ejercicios
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "#F5F5F0" }}>
                {totalSets}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#666" }}>
                Series
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "#F5F5F0" }}>
                {avgRpe}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#666" }}>
                RPE prom.
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "#F5F5F0" }}>
                {estimateSessionTime(currentDay.exercises)}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#666" }}>
                Duración
              </p>
            </div>
          </div>
        </section>
      )}

      {/* RESOURCES */}
      {resourceLines.length > 0 && (
        <section className="px-5 py-6" style={{ borderTop: "1px solid #1A1918" }}>
          <h2
            className="text-[14px] mb-4 tracking-[0.05em]"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              color: "#F5F5F0",
            }}
          >
            Recursos
          </h2>

          {/* YouTube embeds */}
          {youtubeVideos.map((v, i) => (
            <div key={i} className="mb-4" style={{ borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${v.videoId}`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))}

          {/* Text resources */}
          {textResources.length > 0 && (
            <div className="space-y-2">
              {textResources.map((line, i) => (
                <p key={i} className="text-[12px] leading-relaxed" style={{ color: "#AAA" }}>
                  {linkify(line)}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer
        className="px-5 py-6 text-center"
        style={{ borderTop: "1px solid #1A1918" }}
      >
        <p className="text-[10px]" style={{ color: "#444" }}>
          Programa diseñado por Mauro &middot; Iron Cave Gym, Medellín
        </p>
        <p className="text-[9px] mt-1" style={{ color: "#333" }}>
          Powered by FTP by LLVR
        </p>
      </footer>
    </div>
  );
}
