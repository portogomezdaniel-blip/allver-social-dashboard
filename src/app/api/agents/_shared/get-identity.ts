import { createClient } from "@supabase/supabase-js";

export async function getIdentity(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("creator_identity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getRecentPosts(userId: string, limit: number = 10) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("posts")
    .select("caption, post_type, status, scheduled_date, created_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getWeekSchedule(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use Colombia time (UTC-5) for consistent dates on server
  const now = new Date();
  const today = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const { data } = await supabase
    .from("posts")
    .select("caption, post_type, scheduled_date")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .gte("scheduled_date", today.toISOString().split("T")[0])
    .lte("scheduled_date", weekEnd.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  return data ?? [];
}

export async function getKnowledgeContext(userId: string, limit: number = 10): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: fragments } = await supabase
    .from("creator_knowledge")
    .select("category, content")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("content_potential", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!fragments || fragments.length === 0) return "";

  const block = fragments.map((f) => `[${f.category.toUpperCase()}] ${f.content}`).join("\n");

  return `\n\nCONOCIMIENTO PROFUNDO DEL CREADOR (de sus reflexiones personales):\n${block}\n\nUSA estos fragmentos para hacer el contenido mas autentico. Referencia historias reales, usa su vocabulario natural, refleja sus creencias genuinas.`;
}
