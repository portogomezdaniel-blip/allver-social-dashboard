"use client";

import { useState, useEffect, useCallback, useMemo, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlassCardNew from "@/components/ui/GlassCardNew";
import { Toast } from "@/components/ui/Toast";

// ─── Types ─────────────────────────────────────────────
interface StreamIdea {
  id: string;
  creator_id: string;
  text: string;
  status: "active" | "saved" | "archived" | "converted";
  converted_to: string | null;
  converted_format: string | null;
  created_at: string;
  updated_at: string;
}

type TabValue = "all" | "saved" | "archived";

// ─── Constants ─────────────────────────────────────────
const FORMAT_OPTIONS = [
  { value: "reel", label: "Reel", color: "#E85D4A", bg: "rgba(232,93,74,0.12)" },
  { value: "carousel", label: "Carrusel", color: "#8B9A6B", bg: "rgba(139,154,107,0.12)" },
  { value: "story", label: "Stories", color: "#5B8FA8", bg: "rgba(91,143,168,0.12)" },
  { value: "single", label: "Post", color: "#9B7FB8", bg: "rgba(155,127,184,0.12)" },
];
const FMT_LABELS: Record<string, string> = { reel: "Reel", carousel: "Carrusel", story: "Stories", single: "Post" };
const GOLD = "#C9A84C";
const GOLD_BG = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.2)";

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  const d = new Date(dateStr);
  const day = dayNames[d.getDay()];
  const num = d.getDate();
  const mon = monthNames[d.getMonth()];

  if (dateStr === todayStr) return `Hoy · ${day} ${num} ${mon}`;
  if (dateStr === yesterdayStr) return `Ayer · ${day} ${num} ${mon}`;
  return `${day} ${num} ${mon}`;
}

function toDateKey(ts: string): string {
  return new Date(ts).toLocaleDateString("en-CA");
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ═══════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════
export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<StreamIdea[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [tab, setTab] = useState<TabValue>("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [submittingConvert, setSubmittingConvert] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToastDone = useCallback(() => setToast(null), []);

  // ─── Load ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUserId(uid);

      const { data: rows } = await supabase
        .from("ideas_stream")
        .select("*")
        .eq("creator_id", uid)
        .order("created_at", { ascending: false })
        .limit(200);

      setIdeas(rows ?? []);
      setLoading(false);
    });
  }, []);

  // ─── Computed ────────────────────────────────────────
  const counts = useMemo(() => {
    const total = ideas.filter(i => i.status !== "archived").length;
    const saved = ideas.filter(i => i.status === "saved").length;
    const converted = ideas.filter(i => i.status === "converted").length;
    const archived = ideas.filter(i => i.status === "archived").length;
    return { total, saved, converted, archived };
  }, [ideas]);

  const filtered = useMemo(() => {
    let result: StreamIdea[];
    if (tab === "all") result = ideas.filter(i => i.status === "active" || i.status === "saved" || i.status === "converted");
    else if (tab === "saved") result = ideas.filter(i => i.status === "saved");
    else result = ideas.filter(i => i.status === "archived");
    return result.slice(0, limit);
  }, [ideas, tab, limit]);

  const hasMore = useMemo(() => {
    let total: number;
    if (tab === "all") total = ideas.filter(i => i.status !== "archived").length;
    else if (tab === "saved") total = ideas.filter(i => i.status === "saved").length;
    else total = ideas.filter(i => i.status === "archived").length;
    return total > limit;
  }, [ideas, tab, limit]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, StreamIdea[]>();
    for (const idea of filtered) {
      const key = toDateKey(idea.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(idea);
    }
    return map;
  }, [filtered]);

  // ─── Capture ─────────────────────────────────────────
  async function handleCapture() {
    if (!userId || !input.trim() || input.length > 500) return;
    setCapturing(true);
    const text = input.trim();
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    // Optimistic
    const tempId = crypto.randomUUID();
    const optimistic: StreamIdea = {
      id: tempId, creator_id: userId, text, status: "active",
      converted_to: null, converted_format: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setIdeas(prev => [optimistic, ...prev]);

    try {
      const res = await fetch("/api/ideas/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_id: userId, text }),
      });
      const data = await res.json();
      if (data.id) {
        setIdeas(prev => prev.map(i => i.id === tempId ? data : i));
      } else {
        setIdeas(prev => prev.filter(i => i.id !== tempId));
        setToast("No se pudo guardar. Intenta de nuevo.");
      }
    } catch {
      setIdeas(prev => prev.filter(i => i.id !== tempId));
      setToast("No se pudo guardar. Intenta de nuevo.");
    }
    setCapturing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCapture();
    }
  }

  // ─── Status changes ──────────────────────────────────
  async function updateStatus(id: string, newStatus: "active" | "saved" | "archived") {
    const prev = ideas.find(i => i.id === id);
    if (!prev) return;

    setIdeas(p => p.map(i => i.id === id ? { ...i, status: newStatus } : i));
    try {
      const res = await fetch(`/api/ideas/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIdeas(p => p.map(i => i.id === id ? prev : i));
      setToast("No se pudo guardar. Intenta de nuevo.");
    }
  }

  function handleSaveToggle(id: string) {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    updateStatus(id, idea.status === "saved" ? "active" : "saved");
  }

  function handleArchive(id: string) { updateStatus(id, "archived"); }
  function handleRestore(id: string) { updateStatus(id, "active"); }

  // ─── Convert ─────────────────────────────────────────
  function handleStartConvert(id: string) {
    setConvertingId(convertingId === id ? null : id);
    setSelectedFormat(null);
  }

  async function handleConvert(ideaId: string) {
    if (!userId || !selectedFormat) return;
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    setSubmittingConvert(true);
    try {
      const res = await fetch("/api/ideas/convert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_stream_id: ideaId, format: selectedFormat, text: idea.text, creator_id: userId }),
      });
      const data = await res.json();
      if (data.scored_content_id) {
        setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: "converted" as const, converted_to: data.scored_content_id, converted_format: selectedFormat } : i));
        setConvertingId(null);
        router.push(`/ideas/${data.scored_content_id}`);
      } else {
        setToast("Error al convertir. Intenta de nuevo.");
      }
    } catch {
      setToast("Error al convertir. Intenta de nuevo.");
    }
    setSubmittingConvert(false);
  }

  // ─── Auto-resize textarea ────────────────────────────
  function handleInputChange(val: string) {
    if (val.length <= 500) setInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }

  // ─── Render ──────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-[60vh] text-[var(--text-muted)] text-sm">...</div>;

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] md:text-[28px]" style={{ fontFamily: "var(--font-display)" }}>Ideas</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Lo que piensas hoy es el contenido de mañana.
        </p>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2">
        {[
          { n: counts.total, label: "Total", color: "white" },
          { n: counts.saved, label: "Guardadas", color: GOLD },
          { n: counts.converted, label: "Convertidas", color: "#8B9A6B" },
        ].map((s) => (
          <div key={s.label} className="flex-1 p-2.5 rounded-[10px] text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="block text-[18px]" style={{ fontFamily: "var(--font-display)", color: s.color }}>{s.n}</span>
            <span className="block text-[9px]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="rounded-[12px] overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)" }} />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué se te ocurrió? Suelta la idea como venga..."
          rows={2}
          className="w-full bg-transparent text-[14px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none px-4 pt-4 pb-2 resize-none leading-[1.6]"
          style={{ minHeight: 60 }}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}>
            Enter para capturar · Shift+Enter salto de línea
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: input.length > 450 ? "var(--red)" : "var(--text-ghost)" }}>
              {input.length}/500
            </span>
            <button
              onClick={handleCapture}
              disabled={!input.trim() || capturing}
              className="px-3.5 py-1.5 rounded-[8px] text-white transition-opacity text-[11px]"
              style={{ fontFamily: "var(--font-mono)", background: "#8B9A6B", opacity: !input.trim() ? 0.4 : 1 }}
            >
              {capturing ? <Loader2 size={14} className="animate-spin" /> : "Capturar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        {([
          { value: "all" as TabValue, label: "Todas", count: counts.total },
          { value: "saved" as TabValue, label: "Guardadas", count: counts.saved },
          { value: "archived" as TabValue, label: "Archivadas", count: counts.archived },
        ]).map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setLimit(50); }}
            className="flex-1 py-2 rounded-[8px] text-center transition-all text-[10px]"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
              background: tab === t.value ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === t.value ? "var(--text-primary)" : "var(--text-secondary)",
              border: tab === t.value ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
            }}
          >
            {t.label} <span style={{ color: "var(--text-ghost)" }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[28px] mb-2" style={{ color: "var(--text-ghost)" }}>
            {tab === "all" ? "💡" : tab === "saved" ? "⭐" : "🗑"}
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {tab === "all" ? "Captura tu primera idea arriba" : tab === "saved" ? "Guarda ideas para encontrarlas rápido" : "Las ideas archivadas aparecerán aquí"}
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {[...grouped.entries()].map(([dateKey, dayIdeas]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center gap-2 py-3">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>
                  {getDateLabel(dateKey)}
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Ideas */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {dayIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    isConverting={convertingId === idea.id}
                    selectedFormat={convertingId === idea.id ? selectedFormat : null}
                    submittingConvert={submittingConvert && convertingId === idea.id}
                    onSaveToggle={handleSaveToggle}
                    onStartConvert={handleStartConvert}
                    onSelectFormat={setSelectedFormat}
                    onConvert={handleConvert}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                    onNavigate={(id) => router.push(`/ideas/${id}`)}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setLimit(l => l + 50)}
              className="w-full py-3 text-center text-[10px] rounded-[8px] mt-3 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cargar más
            </button>
          )}
        </div>
      )}

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// IDEA CARD
// ═══════════════════════════════════════════════════════
interface IdeaCardProps {
  idea: StreamIdea;
  isConverting: boolean;
  selectedFormat: string | null;
  submittingConvert: boolean;
  onSaveToggle: (id: string) => void;
  onStartConvert: (id: string) => void;
  onSelectFormat: (fmt: string) => void;
  onConvert: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onNavigate: (id: string) => void;
}

function IdeaCard({ idea, isConverting, selectedFormat, submittingConvert, onSaveToggle, onStartConvert, onSelectFormat, onConvert, onArchive, onRestore, onNavigate }: IdeaCardProps) {
  const isSaved = idea.status === "saved";
  const isConverted = idea.status === "converted";
  const isArchived = idea.status === "archived";

  return (
    <div
      className="rounded-[12px] relative overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        border: isConverted
          ? "1px solid rgba(255,255,255,0.08)"
          : isSaved
            ? `1px solid ${GOLD_BORDER}`
            : "1px solid rgba(255,255,255,0.08)",
        borderLeft: isConverted ? "3px solid #8B9A6B" : isSaved ? `1px solid ${GOLD_BORDER}` : "1px solid rgba(255,255,255,0.08)",
        opacity: isArchived ? 0.4 : 1,
        borderStyle: isArchived ? "dashed" : "solid",
      }}
    >
      {/* Shine */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)" }} />

      {/* Saved dot */}
      {isSaved && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ background: GOLD }} />
      )}

      <div className="relative z-[1] p-4">
        {/* Text */}
        <p
          className="text-[14px] leading-[1.6]"
          style={{
            color: "var(--text-primary)",
            textDecoration: isArchived ? "line-through" : "none",
          }}
        >
          {idea.text}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-ghost)" }}>
              {timeAgo(idea.created_at)}
            </span>
            {isConverted && idea.converted_format && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-[4px]" style={{ fontFamily: "var(--font-mono)", background: "rgba(139,154,107,0.12)", color: "#8B9A6B" }}>
                → {FMT_LABELS[idea.converted_format] || idea.converted_format}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {isArchived ? (
              <button
                onClick={() => onRestore(idea.id)}
                className="text-[12px] px-2.5 py-1 rounded-[7px] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ↩ Restaurar
              </button>
            ) : isConverted ? (
              <button
                onClick={() => idea.converted_to && onNavigate(idea.converted_to)}
                className="text-[12px] px-2.5 py-1 rounded-[7px] transition-colors hover:bg-[rgba(139,154,107,0.12)]"
                style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#8B9A6B", border: "1px solid rgba(139,154,107,0.2)" }}
              >
                📝 Ver en Content
              </button>
            ) : (
              <>
                {/* Save */}
                <button
                  onClick={() => onSaveToggle(idea.id)}
                  className="text-[12px] px-2.5 py-1 rounded-[7px] transition-colors"
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 10,
                    color: isSaved ? GOLD : "var(--text-muted)",
                    background: isSaved ? GOLD_BG : "transparent",
                    border: isSaved ? `1px solid ${GOLD_BORDER}` : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {isSaved ? "⭐ Guardada" : "⭐ Guardar"}
                </button>

                {/* Convert */}
                <button
                  onClick={() => onStartConvert(idea.id)}
                  className="text-[12px] px-2.5 py-1 rounded-[7px] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  🚀 Convertir
                </button>

                {/* Archive */}
                <button
                  onClick={() => onArchive(idea.id)}
                  className="text-[12px] px-2 py-1 rounded-[7px] transition-colors hover:bg-[rgba(232,93,74,0.08)] hover:text-[#E85D4A]"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-ghost)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  🗑
                </button>
              </>
            )}
          </div>
        </div>

        {/* Convert panel */}
        {isConverting && !isConverted && !isArchived && (
          <div className="mt-3 pt-3 animate-[fadeUp_0.15s_ease-out]" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>
              ELIGE EL FORMATO
            </span>
            <div className="flex gap-2 mt-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const isSelected = selectedFormat === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => onSelectFormat(fmt.value)}
                    className="flex-1 py-2 rounded-[8px] text-center text-[10px] transition-all"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                      background: isSelected ? fmt.color : fmt.bg,
                      color: isSelected ? "white" : fmt.color,
                      border: `1px solid ${isSelected ? fmt.color : "transparent"}`,
                    }}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onConvert(idea.id)}
              disabled={!selectedFormat || submittingConvert}
              className="w-full mt-3 py-2.5 rounded-[8px] text-white text-[11px] transition-opacity"
              style={{
                fontFamily: "var(--font-mono)",
                background: "#8B9A6B",
                opacity: !selectedFormat ? 0.4 : 1,
              }}
            >
              {submittingConvert
                ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Convirtiendo...</span>
                : `🚀 Generar hooks + copy como ${selectedFormat ? FMT_LABELS[selectedFormat] : "..."}`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
