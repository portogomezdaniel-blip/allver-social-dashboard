"use client";

import { useState, useEffect, useCallback } from "react";
import { PostStatus, PostType } from "@/lib/types";
import type { Platform } from "@/lib/mock-calendar";
import {
  DbPost,
  fetchPosts,
  createPost,
  deletePost,
} from "@/lib/supabase/posts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/instagram/post-card";
import { NewPostDialog } from "@/components/instagram/new-post-dialog";

const statusTabs: { value: PostStatus; label: string }[] = [
  { value: "scheduled", label: "Programados" },
  { value: "draft", label: "Borradores" },
  { value: "published", label: "Publicados" },
  { value: "backlog", label: "Backlog" },
];

export default function InstagramManager() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      setError("");
      const data = await fetchPosts();
      setPosts(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error cargando posts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handleAddPost(post: {
    caption: string;
    postType: PostType;
    status: PostStatus;
    scheduledDate: string | null;
    platform: Platform;
  }) {
    try {
      const newPost = await createPost({
        caption: post.caption,
        post_type: post.postType,
        status: post.status,
        scheduled_date: post.scheduledDate,
        platform: post.platform,
      });
      setPosts((prev) => [newPost, ...prev]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error creando post";
      setError(message);
    }
  }

  async function handleDeletePost(id: string) {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error eliminando post";
      setError(message);
    }
  }

  function getPostsByStatus(status: PostStatus) {
    return posts.filter((p) => p.status === status);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Cargando posts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Instagram Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu contenido de Instagram: ideas, borradores, programados y
            publicados.
          </p>
        </div>
        <NewPostDialog onAdd={handleAddPost} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="bg-muted">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
              <span className="ml-2 text-xs text-muted-foreground">
                ({getPostsByStatus(tab.value).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {getPostsByStatus(tab.value).map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    caption: post.caption,
                    postType: post.post_type,
                    status: post.status,
                    scheduledDate: post.scheduled_date,
                    createdAt: post.created_at.split("T")[0],
                  }}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
            {getPostsByStatus(tab.value).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No hay posts en esta categoria.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
