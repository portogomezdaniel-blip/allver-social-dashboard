"use client";

import SectionShell from "./SectionShell";

interface ScriptBlock {
  title: string;
  desc: string;
  time: string;
}

interface ScriptSectionProps {
  script: ScriptBlock[] | null;
  generating: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onCopy: () => void;
}

export default function ScriptSection({ script, generating, isExpanded, onToggle, onGenerate, onCopy }: ScriptSectionProps) {
  return (
    <SectionShell
      icon="🎬"
      title="Guion"
      subtitle="Estructura del reel con timing"
      count={script ? `${script.length} bloques` : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!script && script.length > 0}
      generating={generating}
      generateLabel="🎬 Generar guion del reel"
      onGenerate={onGenerate}
    >
      <div className="space-y-2">
        {(script || []).map((block, i) => (
          <div key={i} className="p-2.5 rounded-[6px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-[500]" style={{ color: "var(--text-primary)" }}>{block.title}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}>{block.time}</span>
            </div>
            <p className="text-[11px] leading-[1.4]" style={{ color: "var(--text-muted)" }}>{block.desc}</p>
          </div>
        ))}
        <button
          onClick={onCopy}
          className="text-[7px] px-3 py-1.5 rounded-[5px]"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
        >
          Copiar guion
        </button>
      </div>
    </SectionShell>
  );
}
