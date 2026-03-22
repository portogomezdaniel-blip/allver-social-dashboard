"use client";

import { InstagramPost } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const postTypeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carrusel",
  single: "Imagen",
  story: "Story",
};

const postTypeColors: Record<string, string> = {
  reel: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  carousel: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  single: "bg-green-500/20 text-green-300 border-green-500/30",
  story: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  draft: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  published: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  backlog: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

const statusLabels: Record<string, string> = {
  scheduled: "Programado",
  draft: "Borrador",
  published: "Publicado",
  backlog: "Backlog",
};

export function PostCard({
  post,
  onDelete,
}: {
  post: InstagramPost;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={postTypeColors[post.postType]}
          >
            {postTypeLabels[post.postType]}
          </Badge>
          <Badge
            variant="outline"
            className={statusColors[post.status]}
          >
            {statusLabels[post.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed">
          {post.caption}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground pt-0">
        <div className="space-y-1">
          {post.scheduledDate && (
            <p>Programado: {post.scheduledDate}</p>
          )}
          <p>Creado: {post.createdAt}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(post.id)}
        >
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
