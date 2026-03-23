import { createClient } from "./client";

export interface ContentTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  structure: Record<string, unknown>;
  format: string;
  category: string | null;
  suggested_frequency: string | null;
  times_used: number;
  avg_engagement: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchTemplates(): Promise<ContentTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_templates")
    .select("*")
    .order("times_used", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(template: {
  name: string;
  description?: string;
  structure: Record<string, unknown>;
  format: string;
  category?: string;
  suggested_frequency?: string;
}): Promise<ContentTemplate> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("content_templates")
    .insert({ ...template, user_id: user!.id, is_system: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementTemplateUse(id: string): Promise<void> {
  const supabase = createClient();
  const { data: current } = await supabase
    .from("content_templates")
    .select("times_used")
    .eq("id", id)
    .single();

  await supabase
    .from("content_templates")
    .update({
      times_used: (current?.times_used ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("content_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
