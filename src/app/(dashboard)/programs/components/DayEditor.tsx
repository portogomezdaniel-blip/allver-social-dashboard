"use client";

import { ProgramDay, Exercise, createEmptyExercise } from "@/lib/programs";
import ExerciseRow from "./ExerciseRow";
import { Plus, Zap } from "lucide-react";

interface DayEditorProps {
  day: ProgramDay;
  onChange: (day: ProgramDay) => void;
}

export default function DayEditor({ day, onChange }: DayEditorProps) {
  function updateExercise(id: string, field: keyof Exercise, value: string | boolean) {
    const exercises = day.exercises.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    );
    onChange({ ...day, exercises });
  }

  function removeExercise(id: string) {
    if (day.exercises.length <= 1) return;
    onChange({ ...day, exercises: day.exercises.filter((e) => e.id !== id) });
  }

  function addExercise() {
    onChange({ ...day, exercises: [...day.exercises, createEmptyExercise()] });
  }

  function moveExercise(id: string, direction: "up" | "down") {
    const idx = day.exercises.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= day.exercises.length) return;
    const exercises = [...day.exercises];
    [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
    onChange({ ...day, exercises });
  }

  function createBiserie() {
    const selected = day.exercises.filter((e) => e.selected);
    if (selected.length !== 2) return;

    const [a, b] = selected;
    const biserie: Exercise = {
      id: crypto.randomUUID(),
      name: `BISERIE: ${a.name} + ${b.name}`,
      sets: a.sets || b.sets,
      reps: `${a.reps}+${b.reps}`,
      rpe: a.rpe || b.rpe,
      weight: [a.weight, b.weight].filter(Boolean).join("/"),
      rest: a.rest || b.rest,
      notes: "Sin descanso entre ejercicios",
      selected: false,
    };

    const firstIdx = Math.min(
      day.exercises.indexOf(a),
      day.exercises.indexOf(b)
    );
    const exercises = day.exercises.filter(
      (e) => e.id !== a.id && e.id !== b.id
    );
    exercises.splice(firstIdx, 0, biserie);
    onChange({ ...day, exercises });
  }

  const selectedCount = day.exercises.filter((e) => e.selected).length;

  return (
    <div className="space-y-3">
      {/* Day name */}
      <input
        className="bg-transparent text-[14px] font-[700] text-[var(--text-primary)] border-b border-[var(--border-subtle)] focus:border-[var(--olive)] outline-none w-full pb-1"
        style={{ fontFamily: "var(--font-display)" }}
        value={day.name}
        onChange={(e) => onChange({ ...day, name: e.target.value })}
        placeholder="Nombre del día (ej: Squat Day)"
      />

      {/* Exercise table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              <th className="w-10 pb-2"></th>
              <th className="w-8 pb-2 text-center">#</th>
              <th className="pb-2 text-left">Ejercicio</th>
              <th className="w-16 pb-2 text-center">Series</th>
              <th className="w-20 pb-2 text-center">Reps</th>
              <th className="w-16 pb-2 text-center">RPE</th>
              <th className="w-20 pb-2 text-center">Peso</th>
              <th className="w-20 pb-2 text-center">Desc.</th>
              <th className="pb-2 text-left">Notas</th>
              <th className="w-8 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {day.exercises.map((exercise, idx) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === day.exercises.length - 1}
                onChange={updateExercise}
                onRemove={removeExercise}
                onMove={moveExercise}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={addExercise}
          className="flex items-center gap-1.5 text-[11px] text-[var(--olive)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] hover:border-[var(--olive)]"
        >
          <Plus size={12} /> Agregar ejercicio
        </button>
        {selectedCount === 2 && (
          <button
            onClick={createBiserie}
            className="flex items-center gap-1.5 text-[11px] text-[var(--amber)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] hover:border-[var(--amber)]"
          >
            <Zap size={12} /> Crear biserie
          </button>
        )}
      </div>
    </div>
  );
}
