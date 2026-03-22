"use client";

import { useState } from "react";
import { PostStatus, PostType } from "@/lib/types";
import type { Platform } from "@/lib/mock-calendar";
import { GlowButton } from "@/components/ui/glow-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewPostDialogProps {
  onAdd: (post: {
    caption: string;
    postType: PostType;
    status: PostStatus;
    scheduledDate: string | null;
    platform: Platform;
  }) => void;
}

export function NewPostDialog({ onAdd }: NewPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<PostType>("reel");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim()) return;

    onAdd({
      caption: caption.trim(),
      postType,
      status,
      scheduledDate: scheduledDate || null,
      platform,
    });

    setCaption("");
    setPostType("reel");
    setStatus("draft");
    setScheduledDate("");
    setPlatform("instagram");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="relative flex h-min w-fit flex-col items-center overflow-visible rounded-full border border-[#1E2916] bg-[#0D1008] p-px transition-all duration-300 hover:border-[#4A7C2F]">
        <span className="z-10 w-auto rounded-full bg-[#131A0E] px-6 py-2.5 text-xs tracking-[0.15em] uppercase text-[#C8C8C8] transition-colors duration-300 hover:text-[#6AAF3D]">
          + Nuevo Post
        </span>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Nueva idea de post
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Escribe la idea o caption del post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-background border-border min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de post</Label>
              <Select
                value={postType}
                onValueChange={(v) => setPostType(v as PostType)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="carousel">Carrusel</SelectItem>
                  <SelectItem value="single">Imagen</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PostStatus)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v as Platform)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha programada (opcional)</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <GlowButton
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton
              onClick={handleSubmit}
              disabled={!caption.trim()}
            >
              Agregar
            </GlowButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
