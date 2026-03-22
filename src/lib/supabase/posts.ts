import { createClient } from "./client";
import type { PostStatus, PostType } from "../types";
import type { Platform } from "../mock-calendar";

export interface DbPost {
  id: string;
  user_id: string;
  caption: string;
  post_type: PostType;
  status: PostStatus;
  scheduled_date: string | null;
  platform: Platform;
  created_at: string;
}

export async function fetchPosts(): Promise<DbPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPost(post: {
  caption: string;
  post_type: PostType;
  status: PostStatus;
  scheduled_date: string | null;
  platform?: Platform;
}): Promise<DbPost> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, platform: post.platform ?? "instagram", user_id: user!.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(
  id: string,
  updates: Partial<Pick<DbPost, "caption" | "post_type" | "status" | "scheduled_date">>
): Promise<DbPost> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
