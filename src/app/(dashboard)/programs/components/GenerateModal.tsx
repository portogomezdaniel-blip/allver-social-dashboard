"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (program: Record<string, unknown>) => void;
}

export default function GenerateModal({ open, onClose, onGenerated }: GenerateModalProps) {
  const [level, setLevel] = useState("intermedio");
  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [goal, setGoal] = useState("");
  const [sessions, setSessions] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleGenerate() {
    if (!squat || !bench || !deadlift || !goal) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/programs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          numbers: { squat, bench, deadlift },
          goal,
          sessions: parseInt(sessions),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando programa");

      onGenerated(data.program);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-[12px] text-[var(--text-primary)] focus:border-[var(--olive)] outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 w-full max-w-md mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--amber)]" />
            <h3 className="text-[14px] font-[700]" style={{ fontFamily: "var(--font-display)" }}>
              Generar con IA
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Nivel</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Squat (kg)</label>
              <input className={inputClass} value={squat} onChange={(e) => setSquat(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Bench (kg)</label>
              <input className={inputClass} value={bench} onChange={(e) => setBench(e.target.value)} placeholder="80" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Deadlift (kg)</label>
              <input className={inputClass} value={deadlift} onChange={(e) => setDeadlift(e.target.value)} placeholder="130" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Meta</label>
            <input className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Powerlifting competitivo, ganar fuerza..." />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Sesiones/semana</label>
            <select value={sessions} onChange={(e) => setSessions(e.target.value)} className={inputClass}>
              <option value="3">3 días</option>
              <option value="4">4 días</option>
              <option value="5">5 días</option>
              <option value="6">6 días</option>
            </select>
          </div>
        </div>

        {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--olive)] text-[var(--bg-deep)] font-[700] text-[12px] py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Generando programa...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Generar programa
            </>
          )}
        </button>
      </div>
    </div>
  );
}
