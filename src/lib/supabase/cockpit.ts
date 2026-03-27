import { createClient } from "./client";
import type { ScoredIdea } from "./program-output";
import type { JournalEntry } from "./journal";
import type { DailyNews } from "./daily-news";
import type { DbPost } from "./posts";
import { createPost } from "./posts";

// Fetch ideas for the week (scheduled in range + unscheduled suggested)
export async function fetchWeekIdeas(weekStart: string, weekEnd: string): Promise<ScoredIdea[]> {
  const supabase = createClient();

  // Ideas scheduled in this week
  const { data: scheduled } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .in("status", ["suggested", "approved", "scheduled"])
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd)
    .order("total_score", { ascending: false });

  // Unscheduled suggested ideas (backlog)
  const { data: unscheduled } = await supabase
    .from("scored_content_ideas")
    .select("*")
    .in("status", ["suggested", "approved"])
    .is("scheduled_date", null)
    .order("total_score", { ascending: false });

  const all = [...(scheduled ?? []), ...(unscheduled ?? [])];
  // Deduplicate by id
  const seen = new Set<string>();
  return all.filter((idea) => {
    if (seen.has(idea.id)) return false;
    seen.add(idea.id);
    return true;
  });
}

// Fetch journal entries for the week
export async function fetchWeekJournals(weekStart: string, weekEnd: string): Promise<JournalEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .gte("entry_date", weekStart)
    .lte("entry_date", weekEnd)
    .order("entry_date", { ascending: true });
  return data ?? [];
}

// Fetch the hottest news of the week for YouTube mission
export async function fetchWeekTopNews(): Promise<DailyNews | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_news")
    .select("*")
    .eq("urgency", "hot")
    .order("news_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Fetch posts scheduled/published in the week
export async function fetchWeekPosts(weekStart: string, weekEnd: string): Promise<DbPost[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .in("status", ["scheduled", "published"])
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);
  return data ?? [];
}

// Assign an idea to a specific day
export async function assignIdeaToDay(ideaId: string, date: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("scored_content_ideas")
    .update({ scheduled_date: date, status: "approved" })
    .eq("id", ideaId);
  return !error;
}

// Mark idea as scheduled and create a post from it
export async function completeIdea(idea: ScoredIdea): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("scored_content_ideas")
    .update({ status: "scheduled" })
    .eq("id", idea.id);
  if (error) return false;

  const postType = idea.format === "carousel" ? "carousel" : idea.format === "reel" ? "reel" : "single";
  await createPost({
    caption: `${idea.hook}\n\n${idea.description}`,
    post_type: postType as "carousel" | "reel" | "single" | "story",
    status: "scheduled",
    scheduled_date: idea.scheduled_date || new Date().toLocaleDateString("en-CA"),
    platform: "instagram",
  });
  return true;
}

// Update idea hook/description inline
export async function updateIdeaContent(ideaId: string, updates: { hook?: string; description?: string }): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("scored_content_ideas")
    .update(updates)
    .eq("id", ideaId);
  return !error;
}
