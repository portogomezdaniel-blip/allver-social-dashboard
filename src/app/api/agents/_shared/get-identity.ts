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

  const today = new Date();
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
