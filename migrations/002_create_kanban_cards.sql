-- ============================================================
-- Migration: 002_create_kanban_cards
-- Description: Create kanban_cards table with RLS policies
-- Apply: Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Create kanban_cards table
create table if not exists public.kanban_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  column      text not null check (column in ('todo', 'in_progress', 'done')),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.kanban_cards enable row level security;

-- Users can only see their own cards
create policy "Users can view own kanban cards"
  on public.kanban_cards for select
  using (auth.uid() = user_id);

-- Users can insert their own cards
create policy "Users can insert own kanban cards"
  on public.kanban_cards for insert
  with check (auth.uid() = user_id);

-- Users can update their own cards
create policy "Users can update own kanban cards"
  on public.kanban_cards for update
  using (auth.uid() = user_id);

-- Users can delete their own cards
create policy "Users can delete own kanban cards"
  on public.kanban_cards for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger kanban_cards_updated_at
  before update on public.kanban_cards
  for each row execute procedure public.set_updated_at();