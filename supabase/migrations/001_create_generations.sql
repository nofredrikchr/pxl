create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  json_prompt jsonb not null,
  settings jsonb not null default '{}',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  kie_task_id text,
  model_used text not null default 'haiku-4.5',
  created_at timestamptz default now() not null
);

alter table public.generations enable row level security;

create policy "Users can view own generations"
  on public.generations for select using (auth.uid() = user_id);
create policy "Users can insert own generations"
  on public.generations for insert with check (auth.uid() = user_id);
create policy "Users can update own generations"
  on public.generations for update using (auth.uid() = user_id);
create policy "Users can delete own generations"
  on public.generations for delete using (auth.uid() = user_id);

create index idx_generations_user_created on public.generations(user_id, created_at desc);
