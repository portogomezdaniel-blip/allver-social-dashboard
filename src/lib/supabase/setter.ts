import { createClient } from "./client";

export interface SetterLead {
  id: string;
  ig_handle: string;
  display_name: string | null;
  status: string;
  experience_years: number | null;
  training_goal: string | null;
  current_numbers: { squat?: number; bench?: number; deadlift?: number } | null;
  objection: string | null;
  escalation_reason: string | null;
  qualification_score: number | null;
  notes: string | null;
  first_contact_at: string;
  last_message_at: string;
  follow_up_sent: boolean;
  created_at: string;
}

export interface SetterMessage {
  id: string;
  lead_id: string;
  role: "lead" | "setter" | "system";
  content: string;
  classification: string | null;
  created_at: string;
}

export interface SetterCapacity {
  id: number;
  max_clients: number;
  active_clients: number;
  slots_available: number;
  updated_at: string;
}

export async function fetchLeads(statusFilter?: string): Promise<SetterLead[]> {
  const supabase = createClient();
  let query = supabase
    .from("setter_leads")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(leadId: string): Promise<SetterMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("setter_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCapacity(): Promise<SetterCapacity | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("setter_capacity")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data;
}
