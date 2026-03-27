import { createClient } from "./client";

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  ig_handle: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  fitness_level: string;
  training_frequency: number;
  available_equipment: string;
  injuries: string | null;
  primary_goal: string | null;
  secondary_goal: string | null;
  squat_1rm: number | null;
  bench_1rm: number | null;
  deadlift_1rm: number | null;
  current_day: number;
  current_week: number;
  current_phase: number;
  phase_name: string;
  current_streak: number;
  longest_streak: number;
  total_workouts_completed: number;
  challenges_completed: number;
  status: string;
  risk_level: string;
  trainer_id: string | null;
  program_start_date: string | null;
  program_end_date: string | null;
  last_workout_at: string | null;
  last_checkin_at: string | null;
  created_at: string;
  updated_at: string;
  setter_lead_id: string | null;
  acquisition_source: string;
  trainer_notes: string | null;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  interaction_type: string;
  title: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  actor: string;
  created_at: string;
}

export interface ClientOnboarding {
  id: string;
  client_id: string;
  welcome_message: string;
  day1_checklist: unknown;
  initial_assessment: unknown;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  sent_at: string | null;
  trainer_feedback: string | null;
  created_at: string;
}

export async function fetchClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchClient(id: string): Promise<Client | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createClientRecord(client: Partial<Client>): Promise<Client> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...client, status: "onboarding" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientNotes(id: string, notes: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .update({ trainer_notes: notes })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchInteractions(clientId: string): Promise<ClientInteraction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_interactions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOnboarding(clientId: string): Promise<ClientOnboarding[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_onboarding")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAlertCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_alerts")
    .select("client_id")
    .eq("resolved", false);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.client_id] = (counts[row.client_id] || 0) + 1;
  }
  return counts;
}

export async function resolveAlert(alertId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("client_alerts")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", alertId);
  if (error) throw error;
}
