"use client";

import SectionShell from "./SectionShell";

interface HooksSectionProps {
  hooks: string[] | null;
  generating: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onCopy: (text: string) => void;
}

export default function HooksSection({ hooks, generating, isExpanded, onToggle, onGenerate, onCopy }: HooksSectionProps) {
  return (
    <SectionShell
      icon="⚡"
      title="Hooks"
      subtitle="5 variaciones del hook"
      count={hooks ? `${hooks.length}` : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!hooks && hooks.length > 0}
      generating={generating}
      generateLabel="⚡ Generar 5 variaciones"
      onGenerate={onGenerate}
    >
      <div className="space-y-1.5">
        {(hooks || []).map((hook, i) => (
          <div
            key={i}
            className="flex items-start gap-2 p-2 rounded-[6px] group hover:bg-[rgba(255,255,255,0.04)]"
          >
            <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--olive)" }}>{i + 1}</span>
            <p className="text-[12px] leading-[1.4] flex-1" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
              &ldquo;{hook}&rdquo;
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(hook); }}
              className="text-[7px] px-2 py-0.5 rounded-[4px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)", background: "rgba(255,255,255,0.06)" }}
            >
              copiar
            </button>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
