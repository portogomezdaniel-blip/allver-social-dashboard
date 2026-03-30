"use client";

import SectionShell from "./SectionShell";

interface ScriptBlock {
  title: string;
  desc: string;
  time: string;
}

interface ScriptGuion {
  label: string;
  blocks: ScriptBlock[];
  total_duration: string;
}

interface ScriptSectionProps {
  script: ScriptBlock[] | ScriptGuion[] | null;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

function isGuionArray(data: unknown[]): data is ScriptGuion[] {
  return data.length > 0 && typeof data[0] === "object" && data[0] !== null && "blocks" in data[0];
}

export default function ScriptSection({ script, isExpanded, onToggle, onCopy }: ScriptSectionProps) {
  if (!script || script.length === 0) return null;

  // Support both old format (flat blocks) and new format (2 guiones)
  const guiones: ScriptGuion[] = isGuionArray(script)
    ? script
    : [{ label: "Guión 1", blocks: script as ScriptBlock[], total_duration: "" }];

  return (
    <SectionShell
      icon="🎬"
      title="Guión"
      subtitle={`${guiones.length} ${guiones.length === 1 ? "idea de guión" : "ideas de guión"} con timing`}
      count={`${guiones.length} guiones`}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {guiones.map((guion, gi) => (
          <div key={gi}>
            {guiones.length > 1 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-[600]" style={{ fontFamily: "var(--font-display)", color: gi === 0 ? "var(--red)" : "var(--blue)" }}>
                  {guion.label}
                </span>
                {guion.total_duration && (
                  <span className="text-[7px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.06)", color: "var(--text-ghost)" }}>
                    {guion.total_duration}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              {guion.blocks.map((block, i) => (
                <div key={i} className="p-2.5 rounded-[6px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-[500]" style={{ color: "var(--text-primary)" }}>{block.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}>{block.time}</span>
                  </div>
                  <p className="text-[11px] leading-[1.4]" style={{ color: "var(--text-muted)" }}>{block.desc}</p>
                </div>
              ))}
            </div>
            {gi < guiones.length - 1 && (
              <div className="h-px mt-3" style={{ background: "rgba(255,255,255,0.08)" }} />
            )}
          </div>
        ))}
        <button
          onClick={onCopy}
          className="text-[7px] px-3 py-1.5 rounded-[5px]"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-bg)", color: "var(--olive)" }}
        >
          Copiar guión
        </button>
      </div>
    </SectionShell>
  );
}
