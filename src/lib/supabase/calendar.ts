import { createClient } from "./client";
import type { CalendarPost, Platform } from "../mock-calendar";

export async function fetchCalendarPosts(): Promise<CalendarPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, caption, platform, status, scheduled_date, created_at")
    .in("status", ["scheduled", "published"])
    .not("scheduled_date", "is", null)
    .order("scheduled_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.caption.length > 50 ? row.caption.slice(0, 50) + "..." : row.caption,
    platform: (row.platform ?? "instagram") as Platform,
    status: row.status as "scheduled" | "published",
    date: row.scheduled_date!,
    time: new Date(row.created_at).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}
