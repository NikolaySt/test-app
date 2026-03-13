-- ============================================================
-- Migration: 001_create_todos
-- Description: Create todos table with RLS policies
-- Apply: Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Create todos table
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  is_complete boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.todos enable row level security;

-- Users can only see their own todos
create policy "Users can view own todos"
  on public.todos for select
  using (auth.uid() = user_id);

-- Users can insert their own todos
create policy "Users can insert own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

-- Users can update their own todos
create policy "Users can update own todos"
  on public.todos for update
  using (auth.uid() = user_id);

-- Users can delete their own todos
create policy "Users can delete own todos"
  on public.todos for delete
  using (auth.uid() = user_id);