"use client";

import { useState } from "react";
import { mockPosts } from "@/lib/mock-data";
import { InstagramPost, PostStatus, PostType } from "@/lib/types";
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
  const [posts, setPosts] = useState<InstagramPost[]>(mockPosts);

  function handleAddPost(post: Omit<InstagramPost, "id" | "createdAt">) {
    const newPost: InstagramPost = {
      ...post,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPosts((prev) => [newPost, ...prev]);
  }

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function getPostsByStatus(status: PostStatus) {
    return posts.filter((p) => p.status === status);
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
                  post={post}
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
