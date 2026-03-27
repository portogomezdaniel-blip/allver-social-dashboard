// Types & Supabase helpers for Programs module

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rpe: string;
  weight: string;
  rest: string;
  notes: string;
  selected?: boolean;
}

export interface ProgramDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface ProgramData {
  id?: string;
  client_name: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  frequency: number;
  general_notes: string;
  resources: string;
  program_json: { days: ProgramDay[] };
  status: "active" | "completed" | "paused";
  is_published: boolean;
  slug: string | null;
  created_at?: string;
  updated_at?: string;
}

export function createEmptyExercise(): Exercise {
  return {
    id: crypto.randomUUID(),
    name: "",
    sets: "",
    reps: "",
    rpe: "",
    weight: "",
    rest: "",
    notes: "",
    selected: false,
  };
}

export function createEmptyDay(index: number): ProgramDay {
  return {
    id: crypto.randomUUID(),
    name: `Día ${index + 1}`,
    exercises: [createEmptyExercise()],
  };
}

export function generateSlug(clientName: string): string {
  const base = clientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const short = Math.random().toString(36).slice(2, 6);
  return `${base}-${short}`;
}

export function createDefaultProgram(): ProgramData {
  return {
    client_name: "",
    period_label: "",
    period_start: null,
    period_end: null,
    frequency: 4,
    general_notes: "",
    resources: "",
    program_json: {
      days: Array.from({ length: 4 }, (_, i) => createEmptyDay(i)),
    },
    status: "active",
    is_published: false,
    slug: null,
  };
}
