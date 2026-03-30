"use client";

import SectionShell from "./SectionShell";

interface Slide {
  title: string;
  desc: string;
}

interface OutlineSectionProps {
  outline: Slide[] | null;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

export default function OutlineSection({ outline, isExpanded, onToggle, onCopy }: OutlineSectionProps) {
  return (
    <SectionShell
      icon="📊"
      title="Outline de slides"
      subtitle="Estructura del carrusel"
      count={outline ? `${outline.length} slides` : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-1.5">
        {(outline || []).map((slide, i) => (
          <div key={i} className="flex gap-2 p-2 rounded-[6px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[16px] font-[400] flex-shrink-0" style={{ fontFamily: "var(--font-display)", color: "var(--olive)", lineHeight: 1, minWidth: 20, textAlign: "center" as const }}>{i + 1}</span>
            <div>
              <span className="text-[9px] font-[500] block" style={{ color: "var(--text-primary)" }}>{slide.title}</span>
              <p className="text-[10px] leading-[1.4] mt-0.5" style={{ color: "var(--text-muted)" }}>{slide.desc}</p>
            </div>
          </div>
        ))}
        <button
          onClick={onCopy}
          className="text-[7px] px-3 py-1.5 rounded-[5px]"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
        >
          Copiar outline
        </button>
      </div>
    </SectionShell>
  );
}
