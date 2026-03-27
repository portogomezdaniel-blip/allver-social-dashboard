"use client";

interface NotesSectionProps {
  notes: string;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (notes: string) => void;
}

export default function NotesSection({ notes, isExpanded, onToggle, onChange }: NotesSectionProps) {
  return (
    <div
      className="mb-1.5 rounded-[10px] relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />

      <button onClick={onToggle} className="relative z-[1] w-full flex items-center justify-between p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">📌</span>
          <div className="text-left">
            <span style={{ fontFamily: "var(--font-display)", fontSize: 11 }}>Notas</span>
            <span className="block text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Tus apuntes sobre esta idea</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {notes.length > 0 && <span className="text-[7px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>editado</span>}
          <span className={`text-[11px] transition-transform ${isExpanded ? "rotate-90 text-[var(--olive)]" : "text-[var(--text-ghost)]"}`}>&rsaquo;</span>
        </div>
      </button>

      {isExpanded && (
        <div className="relative z-[1] px-3 pb-3 animate-[fadeUp_0.2s_ease-out]">
          <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
          <textarea
            value={notes}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe tus notas sobre esta idea..."
            className="w-full border rounded-[6px] px-3 py-2.5 text-[12px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none min-h-[80px] resize-y"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--olive)"; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
          />
          <p className="text-[7px] mt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>Auto-guardado</p>
        </div>
      )}
    </div>
  );
}
