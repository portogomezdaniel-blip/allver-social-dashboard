"use client";

const FORMATS = [
  { value: "reel", label: "Reel", desc: "IG + TikTok", color: "var(--red)" },
  { value: "carousel", label: "Carrusel", desc: "Instagram", color: "var(--olive)" },
  { value: "story", label: "Stories", desc: "IG Stories", color: "var(--blue)" },
  { value: "single", label: "Post", desc: "Frase / X", color: "var(--purple)" },
];

interface FormatSelectorProps {
  current: string;
  onChange: (format: string) => void;
}

export default function FormatSelector({ current, onChange }: FormatSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
      {FORMATS.map((fmt) => {
        const active = current === fmt.value;
        return (
          <button
            key={fmt.value}
            onClick={() => onChange(fmt.value)}
            className="flex-shrink-0 px-3 py-2 rounded-[8px] text-center transition-colors min-w-[80px]"
            style={{
              background: active ? "var(--olive-bg)" : "rgba(255,255,255,0.06)",
              border: active ? "1px solid rgba(122,140,101,0.3)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-[9px] block" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: active ? fmt.color : "var(--text-secondary)" }}>
              {fmt.label}
            </span>
            <span className="text-[8px] block mt-0.5" style={{ color: "var(--text-ghost)" }}>{fmt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
