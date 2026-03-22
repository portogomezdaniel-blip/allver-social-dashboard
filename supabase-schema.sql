-- ============================================
-- Allver Social Dashboard — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Creators table (user profiles)
create table public.creators (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- 2. Posts table (Instagram content)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.creators(id) on delete cascade not null,
  caption text not null,
  post_type text check (post_type in ('reel', 'carousel', 'single', 'story')) not null,
  status text check (status in ('scheduled', 'draft', 'published', 'backlog')) not null default 'draft',
  scheduled_date date,
  platform text check (platform in ('instagram', 'youtube', 'tiktok', 'linkedin')) not null default 'instagram',
  created_at timestamptz default now() not null
);

-- 3. Enable Row Level Security
alter table public.creators enable row level security;
alter table public.posts enable row level security;

-- 4. RLS Policies — creators
create policy "Users can view their own profile"
  on public.creators for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.creators for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.creators for update
  using (auth.uid() = id);

-- 5. RLS Policies — posts
create policy "Users can view their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- 6. Indexes for performance
create index posts_user_id_idx on public.posts(user_id);
create index posts_status_idx on public.posts(status);
create index posts_created_at_idx on public.posts(created_at desc);
