import { createClient } from "./client";

export interface AnalyticsReport {
  id: string;
  user_id: string;
  report_date: string;
  report_type: string;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_saves: number;
  total_reach: number;
  avg_engagement_rate: number;
  likes_trend: number | null;
  comments_trend: number | null;
  reach_trend: number | null;
  engagement_trend: number | null;
  posting_frequency_trend: number | null;
  format_breakdown: Record<string, { count: number; avg_likes: number; avg_engagement: number }>;
  ai_insights: { type: string; title: string; detail: string; metric: string; icon: string }[];
  ai_recommendations: { priority: string; action: string; reason: string; expected_impact: string }[];
  ai_content_score: number;
  ai_summary: string;
  best_hour: number | null;
  best_day: string | null;
  top_hashtags: Record<string, { count: number; avg_engagement: number }>;
  created_at: string;
}

export async function fetchLatestReport(type: string = "weekly"): Promise<AnalyticsReport | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("analytics_reports")
    .select("*")
    .eq("report_type", type)
    .order("report_date", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function fetchReportHistory(limit: number = 4): Promise<AnalyticsReport[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("analytics_reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}
