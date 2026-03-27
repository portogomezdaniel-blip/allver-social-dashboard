"use client";

import { Exercise } from "@/lib/programs";
import { X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (id: string, field: keyof Exercise, value: string | boolean) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

const inputClass =
  "w-full bg-transparent border-b border-[var(--border-subtle)] focus:border-[var(--olive)] outline-none px-1 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]";

export default function ExerciseRow({
  exercise,
  index,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: ExerciseRowProps) {
  return (
    <tr className="group border-b border-[var(--border-ghost)] hover:bg-[rgba(0,0,0,0.1)]">
      {/* Select + Drag */}
      <td className="w-10 text-center align-middle">
        <div className="flex flex-col items-center gap-0.5">
          <input
            type="checkbox"
            checked={exercise.selected || false}
            onChange={(e) => onChange(exercise.id, "selected", e.target.checked)}
            className="w-3.5 h-3.5 accent-[var(--olive)]"
          />
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFirst && (
              <button onClick={() => onMove(exercise.id, "up")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <ChevronUp size={12} />
              </button>
            )}
            {!isLast && (
              <button onClick={() => onMove(exercise.id, "down")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <ChevronDown size={12} />
              </button>
            )}
          </div>
        </div>
      </td>
      {/* # */}
      <td className="w-8 text-center text-[11px] text-[var(--text-muted)] font-mono align-middle">
        {index + 1}
      </td>
      {/* Ejercicio */}
      <td className="min-w-[160px]">
        <input
          className={inputClass}
          placeholder="Back Squat"
          value={exercise.name}
          onChange={(e) => onChange(exercise.id, "name", e.target.value)}
        />
      </td>
      {/* Series */}
      <td className="w-16">
        <input
          className={`${inputClass} text-center font-mono`}
          placeholder="4"
          value={exercise.sets}
          onChange={(e) => onChange(exercise.id, "sets", e.target.value)}
        />
      </td>
      {/* Reps */}
      <td className="w-20">
        <input
          className={`${inputClass} text-center font-mono`}
          placeholder="5"
          value={exercise.reps}
          onChange={(e) => onChange(exercise.id, "reps", e.target.value)}
        />
      </td>
      {/* RPE */}
      <td className="w-16">
        <input
          className={`${inputClass} text-center font-mono`}
          placeholder="7.5"
          value={exercise.rpe}
          onChange={(e) => onChange(exercise.id, "rpe", e.target.value)}
        />
      </td>
      {/* Peso */}
      <td className="w-20">
        <input
          className={`${inputClass} text-center font-mono`}
          placeholder="85"
          value={exercise.weight}
          onChange={(e) => onChange(exercise.id, "weight", e.target.value)}
        />
      </td>
      {/* Descanso */}
      <td className="w-20">
        <input
          className={`${inputClass} text-center font-mono`}
          placeholder="3:00"
          value={exercise.rest}
          onChange={(e) => onChange(exercise.id, "rest", e.target.value)}
        />
      </td>
      {/* Notas */}
      <td className="min-w-[120px]">
        <input
          className={inputClass}
          placeholder="Pausa 1s"
          value={exercise.notes}
          onChange={(e) => onChange(exercise.id, "notes", e.target.value)}
        />
      </td>
      {/* Delete */}
      <td className="w-8 text-center align-middle">
        <button
          onClick={() => onRemove(exercise.id)}
          className="text-[var(--text-ghost)] hover:text-[var(--red)] transition-colors"
        >
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}
