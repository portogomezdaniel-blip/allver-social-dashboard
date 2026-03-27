"use client";

import { useMemo } from "react";
import JournalMirror from "./JournalMirror";
import FunnelLane from "./FunnelLane";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { JournalEntry } from "@/lib/supabase/journal";
import type { DbPost } from "@/lib/supabase/posts";

interface DayDetailProps {
  date: string; // YYYY-MM-DD
  ideas: ScoredIdea[];
  journal: JournalEntry | null;
  posts: DbPost[];
  backlogIdeas: ScoredIdea[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updates: { hook?: string; description?: string }) => void;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

function formatDate(dateStr: string): { dayName: string; display: string; isSunday: boolean } {
  const d = new Date(dateStr + "T12:00:00");
  const dayIdx = d.getDay();
  return {
    dayName: DAY_NAMES[dayIdx],
    display: `${d.getDate()} ${["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"][d.getMonth()]} ${d.getFullYear()}`,
    isSunday: dayIdx === 0,
  };
}

export default function DayDetail({ date, ideas, journal, posts, backlogIdeas, onClose, onApprove, onReject, onEdit }: DayDetailProps) {
  const { dayName, display, isSunday } = formatDate(date);

  const filterIdeas = useMemo(() => ideas.filter((i) => i.format === "reel"), [ideas]);
  const authorityIdeas = useMemo(() => ideas.filter((i) => i.format === "carousel"), [ideas]);
  const conversionIdeas = useMemo(() => ideas.filter((i) => i.format === "story" || i.format === "single"), [ideas]);

  const totalItems = ideas.length + posts.length;
  const completedItems = ideas.filter((i) => i.status === "scheduled").length + posts.filter((p) => p.status === "published").length;
  const pendingItems = totalItems - completedItems;

  // Sunday rest day
  if (isSunday) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>{dayName}</h2>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{display}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-[18px] p-2">✕</button>
        </div>

        <div className="flex items-center justify-center py-16">
          <p className="text-[48px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)", color: "var(--text-ghost)", opacity: 0.3 }}>
            REST DAY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>{dayName}</h2>
          <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{display}</p>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-[18px] p-2">✕</button>
      </div>

      {/* Journal Mirror */}
      <JournalMirror journal={journal} />

      {/* Funnel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FunnelLane lane="filter" ideas={filterIdeas} onApprove={onApprove} onReject={onReject} onEdit={onEdit} />
        <FunnelLane lane="authority" ideas={authorityIdeas} onApprove={onApprove} onReject={onReject} onEdit={onEdit} />
        <FunnelLane lane="conversion" ideas={conversionIdeas} onApprove={onApprove} onReject={onReject} onEdit={onEdit} />
      </div>

      {/* Backlog suggestions if day is empty */}
      {ideas.length === 0 && backlogIdeas.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-mono mb-2" style={{ color: "var(--text-muted)" }}>
            IDEAS SIN ASIGNAR · ARRASTRA O APRUEBA PARA ESTE DIA
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {backlogIdeas.slice(0, 6).map((idea) => (
              <div key={idea.id} className="p-2 rounded-[var(--radius-md)]" style={{ background: "rgba(0,0,0,0.08)", border: "1px dashed var(--border)" }}>
                <span className="text-[8px] font-mono uppercase" style={{ color: "var(--text-muted)" }}>{idea.format}</span>
                <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                  &ldquo;{idea.hook}&rdquo;
                </p>
                <button
                  onClick={() => onApprove(idea.id)}
                  className="text-[8px] mt-1 px-2 py-0.5 rounded-md transition-colors"
                  style={{ background: "rgba(168,183,142,0.15)", color: "var(--middle)" }}
                >
                  + Asignar aqui
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {completedItems} de {totalItems} completadas · {pendingItems} pendientes
        </span>
      </div>
    </div>
  );
}
