import { createClient } from "./client";

export interface KnowledgeFragment {
  id: string;
  user_id: string;
  source_type: string;
  source_id: string | null;
  source_date: string | null;
  category: string;
  content: string;
  context: string | null;
  emotional_weight: string | null;
  content_potential: string | null;
  times_referenced: number;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

export async function fetchKnowledge(options?: {
  category?: string;
  content_potential?: string;
  limit?: number;
}): Promise<KnowledgeFragment[]> {
  const supabase = createClient();
  let q = supabase.from("creator_knowledge").select("*").eq("is_active", true);
  if (options?.category) q = q.eq("category", options.category);
  if (options?.content_potential) q = q.eq("content_potential", options.content_potential);
  q = q.order("created_at", { ascending: false }).limit(options?.limit || 50);
  const { data } = await q;
  return data ?? [];
}

export async function fetchKnowledgeStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  unusedHighPotential: number;
  latest: KnowledgeFragment | null;
}> {
  const supabase = createClient();
  const { data: all } = await supabase.from("creator_knowledge").select("*").eq("is_active", true).order("created_at", { ascending: false });
  const fragments = all ?? [];
  const byCategory: Record<string, number> = {};
  let unusedHigh = 0;
  for (const f of fragments) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    if (f.times_referenced === 0 && f.content_potential === "high") unusedHigh++;
  }
  return { total: fragments.length, byCategory, unusedHighPotential: unusedHigh, latest: fragments[0] || null };
}

export async function deactivateFragment(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("creator_knowledge").update({ is_active: false }).eq("id", id);
}
