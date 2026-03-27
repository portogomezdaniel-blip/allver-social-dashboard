"use client";

import SectionShell from "./SectionShell";

interface CopySectionProps {
  copy: string | null;
  generating: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onCopy: () => void;
}

export default function CopySection({ copy, generating, isExpanded, onToggle, onGenerate, onCopy }: CopySectionProps) {
  return (
    <SectionShell
      icon="📝"
      title="Copy completo"
      subtitle="Caption listo para publicar"
      count={copy ? "✓" : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!copy}
      generating={generating}
      generateLabel="📝 Generar caption completo"
      onGenerate={onGenerate}
    >
      <div>
        <div className="p-3 rounded-[6px] mb-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] leading-[1.5] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{copy}</p>
        </div>
        <button
          onClick={onCopy}
          className="text-[7px] px-3 py-1.5 rounded-[5px]"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
        >
          Copiar caption
        </button>
      </div>
    </SectionShell>
  );
}
