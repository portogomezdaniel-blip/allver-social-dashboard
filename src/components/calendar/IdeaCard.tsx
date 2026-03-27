"use client";

import { useState } from "react";
import type { ScoredIdea } from "@/lib/supabase/program-output";

interface IdeaCardProps {
  idea: ScoredIdea;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updates: { hook?: string; description?: string }) => void;
}

function scoreClass(score: number): string {
  if (score >= 8.5) return "score-high";
  if (score >= 7) return "score-mid";
  if (score >= 5) return "score-low";
  return "score-ghost";
}

function platformLabel(format: string): string {
  switch (format) {
    case "reel": return "IG REEL";
    case "carousel": return "IG CARRUSEL";
    case "story": return "IG STORY";
    case "single": return "IG POST";
    default: return format.toUpperCase();
  }
}

export default function IdeaCard({ idea, onApprove, onReject, onEdit }: IdeaCardProps) {
  const [editing, setEditing] = useState(false);
  const [hookText, setHookText] = useState(idea.hook);
  const [descText, setDescText] = useState(idea.description);
  const [approved, setApproved] = useState(idea.status === "approved" || idea.status === "scheduled");
  const [fading, setFading] = useState(false);

  function handleApprove() {
    setApproved(true);
    onApprove(idea.id);
  }

  function handleReject() {
    setFading(true);
    setTimeout(() => onReject(idea.id), 300);
  }

  function handleSaveEdit() {
    onEdit(idea.id, { hook: hookText, description: descText });
    setEditing(false);
  }

  return (
    <div
      className={`${scoreClass(idea.total_score)} p-3 rounded-[var(--radius-md)] transition-all duration-300 ${fading ? "opacity-0 scale-95" : ""}`}
      style={{ background: "rgba(0,0,0,0.12)", border: "0.5px solid var(--border-subtle)" }}
    >
      {/* Platform tag */}
      <span
        className="text-[8px] tracking-[0.15em] uppercase font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        {platformLabel(idea.format)}
      </span>

      {/* Hook */}
      {editing ? (
        <textarea
          value={hookText}
          onChange={(e) => setHookText(e.target.value)}
          className="w-full mt-1 p-2 text-[13px] rounded-md bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] resize-none"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          rows={2}
        />
      ) : (
        <p
          className="text-[13px] mt-1 leading-[1.4]"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-primary)" }}
        >
          &ldquo;{idea.hook}&rdquo;
        </p>
      )}

      {/* Description (edit mode) */}
      {editing && (
        <textarea
          value={descText}
          onChange={(e) => setDescText(e.target.value)}
          className="w-full mt-2 p-2 text-[11px] rounded-md bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] resize-none"
          rows={2}
        />
      )}

      {/* Score + Actions row */}
      <div className="flex items-center justify-between mt-2">
        <span
          className="text-[18px] font-[800]"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", lineHeight: 1 }}
        >
          {idea.total_score.toFixed(1)}
        </span>

        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="text-[9px] px-2 py-1 rounded-md transition-colors"
                style={{ background: "rgba(168,183,142,0.15)", color: "var(--middle)" }}
              >
                Guardar
              </button>
              <button
                onClick={() => { setEditing(false); setHookText(idea.hook); setDescText(idea.description); }}
                className="text-[9px] px-2 py-1 rounded-md text-[var(--text-muted)]"
              >
                Cancelar
              </button>
            </>
          ) : approved ? (
            <span
              className="text-[9px] px-2 py-1 rounded-md"
              style={{ background: "rgba(168,183,142,0.15)", color: "var(--middle)" }}
            >
              ✓ Aprobado
            </span>
          ) : (
            <>
              <button
                onClick={handleApprove}
                className="text-[9px] px-2 py-1 rounded-md transition-colors hover:brightness-110"
                style={{ background: "rgba(168,183,142,0.15)", color: "var(--middle)" }}
              >
                Aprobar
              </button>
              <button
                onClick={() => setEditing(true)}
                className="text-[9px] px-2 py-1 rounded-md transition-colors hover:brightness-110"
                style={{ background: "rgba(107,140,186,0.15)", color: "var(--conversion)" }}
              >
                Editar
              </button>
              <button
                onClick={handleReject}
                className="text-[9px] px-1.5 py-1 rounded-md transition-colors hover:brightness-110 text-[var(--text-muted)]"
                style={{ background: "rgba(0,0,0,0.1)" }}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
