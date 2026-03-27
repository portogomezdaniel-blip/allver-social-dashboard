"use client";

import { Loader2 } from "lucide-react";

interface SectionShellProps {
  icon: string;
  title: string;
  subtitle: string;
  count?: string;
  isExpanded: boolean;
  onToggle: () => void;
  hasContent: boolean;
  generating: boolean;
  generateLabel: string;
  onGenerate: () => void;
  children: React.ReactNode;
}

export default function SectionShell({ icon, title, subtitle, count, isExpanded, onToggle, hasContent, generating, generateLabel, onGenerate, children }: SectionShellProps) {
  return (
    <div
      className="mb-1.5 rounded-[10px] relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />

      {/* Header */}
      <button onClick={onToggle} className="relative z-[1] w-full flex items-center justify-between p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{icon}</span>
          <div className="text-left">
            <span style={{ fontFamily: "var(--font-display)", fontSize: 11 }}>{title}</span>
            <span className="block text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {count && <span className="text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>{count}</span>}
          <span className={`text-[11px] transition-transform ${isExpanded ? "rotate-90 text-[var(--olive)]" : "text-[var(--text-ghost)]"}`}>&rsaquo;</span>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="relative z-[1] px-3 pb-3 animate-[fadeUp_0.2s_ease-out]">
          <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />

          {!hasContent ? (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="w-full py-[10px] rounded-[8px] transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: generating ? "var(--text-ghost)" : "var(--olive)",
                background: "rgba(122,140,101,0.15)",
                border: "1px dashed rgba(122,140,101,0.3)",
                opacity: generating ? 0.5 : 1,
                cursor: generating ? "wait" : "pointer",
              }}
            >
              {generating ? <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Generando...</span> : generateLabel}
            </button>
          ) : (
            <>
              {children}
              <button
                onClick={onGenerate}
                disabled={generating}
                className="w-full mt-2 py-1.5 rounded-[6px] transition-colors text-center"
                style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-ghost)", background: "rgba(255,255,255,0.04)" }}
              >
                {generating ? "Generando..." : "↻ Regenerar"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
