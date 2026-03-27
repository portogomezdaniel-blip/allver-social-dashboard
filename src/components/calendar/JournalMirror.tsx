"use client";

import GlassCard from "@/components/mirror/GlassCard";
import type { JournalEntry } from "@/lib/supabase/journal";

interface JournalMirrorProps {
  journal: JournalEntry | null;
}

export default function JournalMirror({ journal }: JournalMirrorProps) {
  if (!journal) return null;

  const questions = [
    { q: journal.question_1, a: journal.answer_1 },
    { q: journal.question_2, a: journal.answer_2 },
    { q: journal.question_3, a: journal.answer_3 },
  ];
  const answered = questions.filter((qa) => qa.a && qa.a.length > 0).length;
  const moodEmoji = journal.mood === "energized" ? "⚡" : journal.mood === "calm" ? "🌊" : journal.mood === "determined" ? "🔥" : journal.mood === "reflective" ? "🪞" : "💭";

  return (
    <GlassCard intensity="subtle" className="p-4 relative overflow-hidden">
      <div style={{ borderLeft: "2px solid var(--depth)", paddingLeft: 12 }}>
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--depth)", animation: "pulse 2s ease-in-out infinite" }} />
          <span className="text-[8px] tracking-[0.2em] uppercase font-mono" style={{ color: "var(--depth)" }}>
            PROFUNDIDAD · TU REFLEJO DE HOY
          </span>
        </div>

        {/* Q&A */}
        <div className="space-y-3">
          {questions.map((qa, i) => (
            <div key={i}>
              <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {qa.q}
              </p>
              {qa.a ? (
                <p className="text-[14px] mt-0.5 leading-[1.4]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-primary)" }}>
                  {qa.a}
                </p>
              ) : (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-ghost)" }}>
                  Sin respuesta
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Mood + count */}
        <div className="flex items-center gap-3 mt-3">
          {journal.mood && (
            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(155,126,184,0.12)", color: "var(--depth)" }}>
              {moodEmoji} {journal.mood}
            </span>
          )}
          <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
            {answered} de 3 preguntas
          </span>
        </div>
      </div>

      {/* Arrow: journal → content */}
      <div className="flex items-center gap-2 mt-4 pl-3">
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path d="M0 6h16M12 1l5 5-5 5" stroke="var(--text-ghost)" strokeWidth="1" />
        </svg>
        <span className="text-[8px] font-mono" style={{ color: "var(--text-ghost)" }}>
          tu reflejo genera contenido
        </span>
      </div>
    </GlassCard>
  );
}
