"use client";

import { useState, useEffect, useCallback } from "react";
import { PostStatus, PostType } from "@/lib/types";
import type { Platform } from "@/lib/mock-calendar";
import { DbPost, fetchPosts, createPost, deletePost } from "@/lib/supabase/posts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/instagram/post-card";
import { NewPostDialog } from "@/components/instagram/new-post-dialog";
import { useLocale } from "@/lib/locale-context";
import GlassCard from "@/components/mirror/GlassCard";

const statusColors: Record<string, string> = { draft: "var(--text-muted)", scheduled: "var(--blue)", published: "var(--olive)", backlog: "var(--text-muted)" };
const statusSubtexts: Record<string, string> = { draft: "En gestacion", scheduled: "Esperando su momento", published: "En el mundo", backlog: "Archivados" };

export default function InstagramManager() {
  const { t } = useLocale();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const statusTabs: { value: PostStatus; label: string }[] = [
    { value: "scheduled", label: t("content.scheduled") },
    { value: "draft", label: t("content.drafts") },
    { value: "published", label: t("content.published") },
    { value: "backlog", label: t("content.backlog") },
  ];

  const loadPosts = useCallback(async () => {
    try { setError(""); setPosts(await fetchPosts()); } catch (err: unknown) { setError(err instanceof Error ? err.message : t("content.error_loading")); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  async function handleAddPost(post: { caption: string; postType: PostType; status: PostStatus; scheduledDate: string | null; platform: Platform }) {
    try {
      const newPost = await createPost({ caption: post.caption, post_type: post.postType, status: post.status, scheduled_date: post.scheduledDate, platform: post.platform });
      setPosts((prev) => [newPost, ...prev]);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t("content.error_creating")); }
  }

  async function handleDeletePost(id: string) {
    try { await deletePost(id); setPosts((prev) => prev.filter((p) => p.id !== id)); } catch (err: unknown) { setError(err instanceof Error ? err.message : t("content.error_deleting")); }
  }

  function getPostsByStatus(status: PostStatus) { return posts.filter((p) => p.status === status); }

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-[var(--text-muted)] text-sm">...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Tu contenido</h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Cada post es una huella de tu presencia</p>
        </div>
        <NewPostDialog onAdd={handleAddPost} />
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statusTabs.map((tab) => {
          const count = getPostsByStatus(tab.value).length;
          return (
            <GlassCard key={tab.value} intensity="ghost" className="p-3" >
              <div style={{ borderLeft: `2px solid ${statusColors[tab.value]}`, paddingLeft: "10px" }}>
                <p className="text-[18px] font-mono font-[800]">{count}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{tab.label}</p>
                <p className="text-[8px] text-[var(--text-muted)] italic">{statusSubtexts[tab.value]}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {error && <div className="p-3 rounded-lg text-[11px]" style={{ background: "var(--red-bg)", color: "var(--red)", border: "0.5px solid var(--red)" }}>{error}</div>}

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="bg-[rgba(0,0,0,0.12)] border border-[var(--border-ghost)] rounded-lg">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-[11px] data-[state=active]:bg-[rgba(0,0,0,0.2)]">
              {tab.label} <span className="ml-1.5 text-[9px] text-[var(--text-muted)]">({getPostsByStatus(tab.value).length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {getPostsByStatus(tab.value).map((post) => (
                <PostCard key={post.id} post={{ id: post.id, caption: post.caption, postType: post.post_type, status: post.status, scheduledDate: post.scheduled_date, createdAt: post.created_at.split("T")[0] }} onDelete={handleDeletePost} />
              ))}
            </div>
            {getPostsByStatus(tab.value).length === 0 && (
              <div className="text-center py-12">
                <p className="text-[12px] text-[var(--text-muted)]">{t("content.no_posts")}</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
