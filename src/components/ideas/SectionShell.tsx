"use client";

interface SectionShellProps {
  icon: string;
  title: string;
  subtitle: string;
  count?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function SectionShell({ icon, title, subtitle, count, isExpanded, onToggle, children }: SectionShellProps) {
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
          {children}
        </div>
      )}
    </div>
  );
}
