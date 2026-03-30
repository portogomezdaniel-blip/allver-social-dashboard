"use client";

import { useState } from "react";
import type { PostStatus, PostType } from "@/lib/types";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  reel: { bg: "var(--red-bg)", color: "var(--red)" },
  carousel: { bg: "var(--olive-bg)", color: "var(--olive)" },
  single: { bg: "var(--blue-bg)", color: "var(--blue)" },
  story: { bg: "var(--amber-bg)", color: "var(--amber)" },
};
const TYPE_LABELS: Record<string, string> = { reel: "Reel", carousel: "Carrusel", single: "Imagen", story: "Story" };
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "var(--blue-bg)", color: "var(--blue)" },
  draft: { bg: "rgba(255,255,255,0.06)", color: "var(--text-muted)" },
  published: { bg: "var(--olive-bg)", color: "var(--olive)" },
  backlog: { bg: "rgba(255,255,255,0.04)", color: "var(--text-ghost)" },
};
const STATUS_LABELS: Record<string, string> = { scheduled: "Programado", draft: "Borrador", published: "Publicado", backlog: "Backlog" };
const ALL_STATUSES: PostStatus[] = ["scheduled", "draft", "published", "backlog"];

interface PostCardProps {
  post: {
    id: string;
    caption: string;
    postType: PostType;
    status: PostStatus;
    scheduledDate: string | null;
    createdAt: string;
  };
  isSelected: boolean;
  isProximity: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<{ caption: string; post_type: PostType; status: PostStatus; scheduled_date: string | null }>) => void;
  onDuplicate: (id: string) => void;
  onClick: (id: string) => void;
}

export function PostCard({ post, isSelected, isProximity, onSelect, onDelete, onUpdate, onDuplicate, onClick }: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const tc = TYPE_COLORS[post.postType] || TYPE_COLORS.single;
  const sc = STATUS_COLORS[post.status] || STATUS_COLORS.draft;

  return (
    <div
      className="rounded-[8px] relative overflow-hidden transition-all group"
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
        border: isSelected ? "1px solid var(--olive)" : isProximity ? "1px solid rgba(212,101,91,0.3)" : "1px solid rgba(255,255,255,0.08)",
        animation: isProximity ? "pulse-dot 3s ease-in-out infinite" : undefined,
      }}
    >
      {/* Shine */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)" }} />

      {/* Checkbox — visible on hover or when selected */}
      <div
        className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(post.id); }}
          className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-[10px] transition-colors"
          style={{
            background: isSelected ? "var(--olive)" : "rgba(255,255,255,0.08)",
            border: isSelected ? "1px solid var(--olive)" : "1px solid rgba(255,255,255,0.15)",
            color: isSelected ? "white" : "transparent",
          }}
        >
          ✓
        </button>
      </div>

      {/* Main clickable area */}
      <div className="relative z-[1] p-3 cursor-pointer" onClick={() => onClick(post.id)}>
        {/* Top row: badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[7px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: tc.bg, color: tc.color }}>
            {TYPE_LABELS[post.postType] || post.postType}
          </span>
          <span className="text-[7px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: sc.bg, color: sc.color }}>
            {STATUS_LABELS[post.status]}
          </span>
          {isProximity && (
            <span className="text-[6px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}>
              PRONTO
            </span>
          )}
        </div>

        {/* Caption preview */}
        <p className="text-[12px] leading-[1.4] line-clamp-2 mb-2" style={{ color: post.caption ? "var(--text-secondary)" : "var(--text-ghost)", fontStyle: post.caption ? "normal" : "italic" }}>
          {post.caption || "Sin caption"}
        </p>

        {/* Dates */}
        <div className="flex items-center gap-3" style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-ghost)" }}>
          {post.scheduledDate && <span>📅 {post.scheduledDate}</span>}
          <span>🕐 {post.createdAt}</span>
        </div>
      </div>

      {/* Actions row */}
      <div className="relative z-[1] flex items-center justify-between px-3 pb-2">
        <div className="flex gap-1">
          {/* Status change */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(!statusMenuOpen); setMenuOpen(false); }}
              className="text-[7px] px-2 py-1 rounded-[4px] transition-colors"
              style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              Estado ▾
            </button>
            {statusMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 rounded-[6px] overflow-hidden" style={{ background: "rgba(40,43,37,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 110 }}>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); onUpdate(post.id, { status: s }); setStatusMenuOpen(false); }}
                    className="block w-full text-left text-[8px] px-3 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                    style={{ fontFamily: "var(--font-mono)", color: post.status === s ? "var(--olive)" : "var(--text-secondary)" }}
                  >
                    {post.status === s ? "✓ " : ""}{STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setStatusMenuOpen(false); }}
            className="text-[14px] px-1.5 transition-colors"
            style={{ color: "var(--text-ghost)" }}
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 z-20 rounded-[6px] overflow-hidden" style={{ background: "rgba(40,43,37,0.98)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 130 }}>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(post.id); setMenuOpen(false); }} className="block w-full text-left text-[9px] px-3 py-2 transition-colors hover:bg-[rgba(255,255,255,0.06)]" style={{ color: "var(--text-secondary)" }}>
                📋 Duplicar
              </button>
              {!confirmDelete ? (
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} className="block w-full text-left text-[9px] px-3 py-2 transition-colors hover:bg-[rgba(255,255,255,0.06)]" style={{ color: "var(--red)" }}>
                  🗑 Eliminar
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); setMenuOpen(false); }} className="block w-full text-left text-[9px] px-3 py-2 font-bold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
                  ⚠ Confirmar eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
