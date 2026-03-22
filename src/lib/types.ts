export type PostStatus = "scheduled" | "draft" | "published" | "backlog";

export type PostType = "reel" | "carousel" | "single" | "story";

export interface InstagramPost {
  id: string;
  caption: string;
  postType: PostType;
  status: PostStatus;
  scheduledDate: string | null;
  createdAt: string;
}
