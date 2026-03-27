"use client";

import { useState } from "react";
import { ProgramData, ProgramDay, createEmptyDay } from "@/lib/programs";
import DayEditor from "./DayEditor";
import GenerateModal from "./GenerateModal";
import { Save, Globe, Eye, Sparkles, Loader2 } from "lucide-react";

interface RoutineEditorProps {
  program: ProgramData;
  onChange: (program: ProgramData) => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
}

export default function RoutineEditor({
  program,
  onChange,
  onSave,
  onPublish,
  saving,
  publishing,
}: RoutineEditorProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [showGenerate, setShowGenerate] = useState(false);

  const days = program.program_json.days || [];

  function updateField<K extends keyof ProgramData>(field: K, value: ProgramData[K]) {
    onChange({ ...program, [field]: value });
  }

  function updateDay(index: number, day: ProgramDay) {
    const newDays = [...days];
    newDays[index] = day;
    onChange({ ...program, program_json: { days: newDays } });
  }

  function handleFrequencyChange(freq: number) {
    const currentDays = [...days];
    if (freq > currentDays.length) {
      for (let i = currentDays.length; i < freq; i++) {
        currentDays.push(createEmptyDay(i));
      }
    } else {
      currentDays.length = freq;
    }
    onChange({
      ...program,
      frequency: freq,
      program_json: { days: currentDays },
    });
    if (activeDay >= freq) setActiveDay(freq - 1);
  }

  function handleGenerated(aiProgram: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prog = aiProgram as any;
    if (prog.program?.days) {
      const newDays: ProgramDay[] = prog.program.days.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any, i: number) => ({
          id: crypto.randomUUID(),
          name: d.focus || d.day || `Día ${i + 1}`,
          exercises: (d.exercises || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ex: any) => ({
              id: crypto.randomUUID(),
              name: ex.name || "",
              sets: String(ex.sets || ""),
              reps: String(ex.reps || ""),
              rpe: String(ex.rpe_target || ""),
              weight: String(ex.estimated_weight_kg || ""),
              rest: "",
              notes: ex.notes || "",
              selected: false,
            })
          ),
        })
      );
      onChange({
        ...program,
        frequency: newDays.length,
        program_json: { days: newDays },
      });
      setActiveDay(0);
    }
  }

  const inputClass =
    "bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-[12px] text-[var(--text-primary)] focus:border-[var(--olive)] outline-none";

  const previewUrl = program.slug ? `/r/${program.slug}` : null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Cliente</label>
          <input
            className={`${inputClass} w-full`}
            value={program.client_name}
            onChange={(e) => updateField("client_name", e.target.value)}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Título del período</label>
          <input
            className={`${inputClass} w-full`}
            value={program.period_label || ""}
            onChange={(e) => updateField("period_label", e.target.value)}
            placeholder="Semanas 1-2 · Fuerza Base"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Fecha inicio</label>
          <input
            type="date"
            className={`${inputClass} w-full`}
            value={program.period_start || ""}
            onChange={(e) => updateField("period_start", e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Fecha fin</label>
          <input
            type="date"
            className={`${inputClass} w-full`}
            value={program.period_end || ""}
            onChange={(e) => updateField("period_end", e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Frecuencia</label>
          <select
            className={`${inputClass} w-full`}
            value={program.frequency}
            onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
          >
            <option value={3}>3 días/semana</option>
            <option value={4}>4 días/semana</option>
            <option value={5}>5 días/semana</option>
            <option value={6}>6 días/semana</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-[var(--amber)] text-[var(--bg-deep)] font-[700] text-[11px] px-4 py-2 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
          >
            <Sparkles size={13} /> GENERAR CON IA
          </button>
        </div>
      </div>

      {/* General notes */}
      <div>
        <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Nota general del entrenador</label>
        <textarea
          className={`${inputClass} w-full h-20 resize-none`}
          value={program.general_notes || ""}
          onChange={(e) => updateField("general_notes", e.target.value)}
          placeholder="Instrucciones globales para este período..."
        />
      </div>

      {/* DAY TABS */}
      <div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {days.map((day, idx) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(idx)}
              className={`px-4 py-2 text-[11px] font-[700] uppercase tracking-[0.05em] rounded-[var(--radius-sm)] whitespace-nowrap transition-all ${
                activeDay === idx
                  ? "bg-[var(--olive)] text-[var(--bg-deep)]"
                  : "bg-[rgba(0,0,0,0.15)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Día {idx + 1}
              <span className="block text-[9px] font-normal mt-0.5 opacity-70">{day.name}</span>
            </button>
          ))}
        </div>

        {/* Active day editor */}
        {days[activeDay] && (
          <div className="bg-[rgba(0,0,0,0.12)] border border-[var(--border-ghost)] rounded-[var(--radius-md)] p-4 mt-2">
            <DayEditor
              day={days[activeDay]}
              onChange={(day) => updateDay(activeDay, day)}
            />
          </div>
        )}
      </div>

      {/* RESOURCES */}
      <div>
        <label className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1 block">Recursos y lecturas</label>
        <textarea
          className={`${inputClass} w-full h-24 resize-none`}
          value={program.resources || ""}
          onChange={(e) => updateField("resources", e.target.value)}
          placeholder="URLs, videos de YouTube, recomendaciones... (una por línea)"
        />
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border-ghost)]">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[rgba(0,0,0,0.2)] border border-[var(--border)] text-[var(--text-primary)] font-[700] text-[11px] px-5 py-2.5 rounded-[var(--radius-sm)] hover:border-[var(--olive)] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          GUARDAR BORRADOR
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex items-center gap-2 bg-[var(--olive)] text-[var(--bg-deep)] font-[700] text-[11px] px-5 py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {publishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
          PUBLICAR
        </button>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px] px-3 py-2.5 transition-colors"
          >
            <Eye size={13} /> PREVIEW
          </a>
        )}
      </div>

      {/* Generate Modal */}
      <GenerateModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerated={handleGenerated}
      />
    </div>
  );
}
