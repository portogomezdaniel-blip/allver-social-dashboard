"use client";

import { useState } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";

const FMT_COLORS: Record<string, string> = { reel: "var(--red)", carousel: "var(--olive)", story: "var(--blue)", single: "var(--purple)" };
const FMT_BG: Record<string, string> = { reel: "var(--red-bg)", carousel: "var(--olive-bg)", story: "var(--blue-bg)", single: "var(--purple-bg)" };
const FMT_LABELS: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const SRC_ICONS: Record<string, string> = { journal: "\uD83D\uDCD3", ideas_bar: "\uD83D\uDCA1", intel: "\uD83D\uDCF0", program: "\uD83C\uDFAF", daily_suggestion: "\u2728" };
const SRC_LABELS: Record<string, string> = { journal: "Journal", ideas_bar: "Ideas", intel: "Intel", program: "Programa", daily_suggestion: "Daily" };

const FORMAT_OPTIONS = [
  { value: "reel", label: "Reel", desc: "IG + TikTok" },
  { value: "carousel", label: "Carrusel", desc: "Instagram" },
  { value: "story", label: "Stories", desc: "IG Stories" },
  { value: "single", label: "Post", desc: "Frase / X" },
];

const DAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

interface IdeaActionPanelProps {
  idea: ScoredIdea;
  isExpanded: boolean;
  onToggle: () => void;
  onAssignToDay: (ideaId: string, date: string) => void;
  onChangeFormat: (ideaId: string, newFormat: string) => void;
  onMarkRecordToday: (ideaId: string) => void;
  onCopy: (text: string) => void;
  onKeep: (ideaId: string) => void;
  onReject: (ideaId: string) => void;
  daysWithContent?: string[];
}

function build14Days() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toLocaleDateString("en-CA"),
      num: d.getDate(),
      dayOfWeek: d.getDay(),
      isToday: i === 0,
      label: d.toLocaleDateString("es", { day: "numeric", month: "short" }),
    };
  });
}

export default function IdeaActionPanel({ idea, isExpanded, onToggle, onAssignToDay, onChangeFormat, onMarkRecordToday, onCopy, onKeep, onReject, daysWithContent = [] }: IdeaActionPanelProps) {
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [showFormatChanger, setShowFormatChanger] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const opacity = idea.total_score >= 8 ? 1 : idea.total_score >= 7 ? 0.9 : idea.total_score >= 5 ? 0.75 : 0.5;
  const fmtColor = FMT_COLORS[idea.format] || "var(--olive)";
  const calDays = build14Days();

  // Pad calendar to start on Monday
  const firstDow = calDays[0].dayOfWeek;
  const padStart = firstDow === 0 ? 6 : firstDow - 1;

  return (
    <div style={{ opacity, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)] group"
      >
        {/* Score */}
        <span className="text-[14px] min-w-[28px] text-center flex-shrink-0" style={{ fontFamily: "var(--font-display)", color: "var(--olive)" }}>
          {idea.total_score.toFixed(1)}
        </span>

        {/* Hook + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-[500] text-white truncate">{idea.hook}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {SRC_ICONS[idea.source] || "\u00B7"} {SRC_LABELS[idea.source] || idea.source}
            </span>
            {idea.scheduled_date && (
              <span className="text-[10px]" style={{ color: "var(--text-ghost)" }}>
                \u00B7 {new Date(idea.scheduled_date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>

        {/* Format tag */}
        <span
          className="text-[8px] px-2 py-0.5 rounded-[5px] flex-shrink-0"
          style={{ fontFamily: "var(--font-mono)", background: FMT_BG[idea.format] || "var(--olive-bg)", color: fmtColor }}
        >
          {FMT_LABELS[idea.format] || idea.format}
        </span>

        {/* Chevron */}
        <span
          className="text-[10px] flex-shrink-0 transition-transform"
          style={{ color: "var(--text-ghost)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          \u203A
        </span>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="px-3 pb-4 animate-[fadeUp_0.2s_ease-out]">
          <div className="mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

          {/* Description if exists */}
          {idea.description && (
            <p className="text-[11px] mb-3 leading-[1.4]" style={{ color: "var(--text-muted)" }}>{idea.description}</p>
          )}

          {/* 4 action buttons grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Programar */}
            <button
              onClick={() => { setShowCalPicker(!showCalPicker); setShowFormatChanger(false); }}
              className="flex items-center gap-2 p-[10px_12px] rounded-[8px] text-left transition-all hover:translate-y-[-1px] relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: showCalPicker ? "1px solid rgba(122,140,101,0.3)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="text-[14px]">{"\uD83D\uDCC5"}</span>
              <div>
                <span className="text-[11px] font-[500] text-white block">Programar</span>
                <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>Elegir dia para publicar</span>
              </div>
            </button>

            {/* Grabar hoy */}
            <button
              onClick={() => onMarkRecordToday(idea.id)}
              className="flex items-center gap-2 p-[10px_12px] rounded-[8px] text-left transition-all hover:translate-y-[-1px]"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <span className="text-[14px]">{"\uD83C\uDFAC"}</span>
              <div>
                <span className="text-[11px] font-[500] text-white block">Grabar hoy</span>
                <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>Marcar para producir hoy</span>
              </div>
            </button>

            {/* Cambiar formato */}
            <button
              onClick={() => { setShowFormatChanger(!showFormatChanger); setShowCalPicker(false); }}
              className="flex items-center gap-2 p-[10px_12px] rounded-[8px] text-left transition-all hover:translate-y-[-1px]"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: showFormatChanger ? "1px solid rgba(122,140,101,0.3)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="text-[14px]">{"\uD83D\uDD04"}</span>
              <div>
                <span className="text-[11px] font-[500] text-white block">Cambiar formato</span>
                <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>{FMT_LABELS[idea.format]} → otro</span>
              </div>
            </button>

            {/* Copiar idea */}
            <button
              onClick={() => onCopy(idea.hook)}
              className="flex items-center gap-2 p-[10px_12px] rounded-[8px] text-left transition-all hover:translate-y-[-1px]"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <span className="text-[14px]">{"\uD83D\uDCCB"}</span>
              <div>
                <span className="text-[11px] font-[500] text-white block">Copiar idea</span>
                <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>Copiar texto al portapapeles</span>
              </div>
            </button>
          </div>

          {/* Calendar picker */}
          {showCalPicker && (
            <div className="rounded-[8px] p-3 mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <p className="mb-2" style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>
                Que dia la publicas?
              </p>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map((h) => (
                  <div key={h} className="text-center text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>{h}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Pad start */}
                {Array.from({ length: padStart }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {calDays.map((day) => {
                  const isSelected = selectedDay === day.date;
                  const hasContent = daysWithContent.includes(day.date);
                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDay(day.date)}
                      className="relative flex flex-col items-center py-1.5 rounded-[6px] transition-colors"
                      style={{
                        background: isSelected ? "var(--olive-bg)" : "transparent",
                        border: isSelected ? "1px solid rgba(122,140,101,0.3)" : "1px solid transparent",
                        color: day.isToday ? "var(--red)" : isSelected ? "var(--olive)" : "var(--text-secondary)",
                        fontWeight: day.isToday ? 700 : 500,
                        fontSize: 12,
                      }}
                    >
                      {day.num}
                      {hasContent && (
                        <div className="w-1 h-1 rounded-full bg-[var(--olive)] mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Footer */}
              {selectedDay && (
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Publicar el {new Date(selectedDay + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long" })}
                  </span>
                  <button
                    onClick={() => { onAssignToDay(idea.id, selectedDay); setShowCalPicker(false); setSelectedDay(null); }}
                    className="text-[9px] px-3 py-1.5 rounded-[6px] text-white"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-dark)" }}
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Format changer */}
          {showFormatChanger && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {FORMAT_OPTIONS.map((opt) => {
                const isActive = idea.format === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { if (!isActive) onChangeFormat(idea.id, opt.value); setShowFormatChanger(false); }}
                    className="flex-1 min-w-[80px] p-2 rounded-[8px] text-center transition-colors"
                    style={{
                      background: isActive ? "var(--olive-bg)" : "rgba(255,255,255,0.06)",
                      border: isActive ? "1px solid rgba(122,140,101,0.3)" : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <span className="text-[9px] block" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: isActive ? "var(--olive)" : "var(--text-secondary)" }}>
                      {opt.label}
                    </span>
                    <span className="text-[9px] block mt-0.5" style={{ color: "var(--text-ghost)" }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onKeep(idea.id)}
              className="text-[7px] px-3 py-1.5 rounded-[6px] transition-colors"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
            >
              Guardar
            </button>
            <button
              onClick={() => onCopy(idea.hook)}
              className="text-[7px] px-3 py-1.5 rounded-[6px] transition-colors"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Copiar texto
            </button>
            <button
              onClick={() => onReject(idea.id)}
              className="text-[7px] px-3 py-1.5 rounded-[6px] transition-colors hover:text-[var(--red)]"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
