"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

const FORMAT_STYLES: Record<string, { bg: string; color: string; label: string; plat: string }> = {
  reel:     { bg: "rgba(196,69,58,0.1)",  color: "#C4453A", label: "Reel",     plat: "IG + TikTok" },
  carousel: { bg: "rgba(168,183,142,0.1)", color: "#A8B78E", label: "Carrusel", plat: "Instagram" },
  story:    { bg: "rgba(107,140,186,0.1)", color: "#6B8CBA", label: "Stories",  plat: "IG Stories" },
  single:   { bg: "rgba(155,126,184,0.1)", color: "#9B7EB8", label: "Post",     plat: "Instagram" },
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "#A8B78E",
  approved:  "#C8AA50",
  suggested: "rgba(165,163,157,0.5)",
};

interface ContentBlockProps {
  format: string;
  status: string;
  ideas: ScoredIdea[];
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function getBlockStatus(ideas: ScoredIdea[]): string {
  if (ideas.every((i) => i.status === "scheduled")) return "scheduled";
  if (ideas.some((i) => i.status === "approved")) return "approved";
  return "suggested";
}

export default function ContentBlock({ format, ideas, isExpanded, onToggle, onApprove, onReject }: ContentBlockProps) {
  const style = FORMAT_STYLES[format] || FORMAT_STYLES.single;
  const blockStatus = getBlockStatus(ideas);
  const dotColor = STATUS_DOT[blockStatus] || STATUS_DOT.suggested;

  return (
    <div>
      {/* Closed state — compact block */}
      <button
        onClick={onToggle}
        className="w-full text-left rounded-[6px] px-[6px] py-[7px] transition-transform hover:scale-[1.03]"
        style={{
          background: style.bg,
          borderLeft: `3px solid ${style.color}`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: dotColor }}
          />
          <span
            className="text-[7px] tracking-[0.12em] uppercase flex-shrink-0"
            style={{ fontFamily: "var(--font-mono)", color: style.color }}
          >
            {style.label}
          </span>
          <span
            className="text-[6px] flex-1 min-w-0 truncate"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
          >
            {style.plat}
          </span>
          <span
            className="text-[8px] transition-transform flex-shrink-0"
            style={{
              color: "var(--text-ghost)",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ›
          </span>
        </div>
      </button>

      {/* Expanded state */}
      {isExpanded && (
        <div
          className="rounded-b-[6px] px-2 py-2 animate-[fadeUp_0.2s_ease-out]"
          style={{
            background: style.bg.replace("0.1)", "0.06)"),
            border: `0.5px solid ${style.color}20`,
            borderTop: "none",
          }}
        >
          {ideas.length > 0 ? (
            <div className="space-y-1.5">
              {ideas.map((idea) => (
                <div key={idea.id} className="flex items-start gap-1.5">
                  <p
                    className="text-[10px] leading-[1.35] flex-1 min-w-0"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                    }}
                  >
                    &ldquo;{idea.hook}&rdquo;
                  </p>
                  {idea.status === "scheduled" ? (
                    <span
                      className="text-[6px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "#A8B78E",
                        background: "rgba(168,183,142,0.12)",
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onApprove(idea.id); }}
                        className="text-[6px] px-1.5 py-0.5 rounded transition-colors"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "#A8B78E",
                          background: "rgba(168,183,142,0.12)",
                        }}
                      >
                        Usar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReject(idea.id); }}
                        className="text-[6px] px-1 py-0.5 rounded transition-colors hover:text-[#C4453A]"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-ghost)",
                          background: "rgba(0,0,0,0.06)",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <p
                className="text-[7px] tracking-[0.08em]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
              >
                Sin opciones de copy
              </p>
              <button
                onClick={() => console.log("TODO: llamar agente de hooks")}
                className="text-[7px] mt-1.5 px-3 py-1 rounded-[6px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "#A8B78E",
                  border: "1px dashed rgba(168,183,142,0.3)",
                  background: "transparent",
                }}
              >
                Generar opciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
