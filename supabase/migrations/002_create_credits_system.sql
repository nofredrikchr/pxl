-- Credits balance per user
create table public.user_credits (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz default now() not null
);

alter table public.user_credits enable row level security;

create policy "Users can view own credits"
  on public.user_credits for select using (auth.uid() = user_id);

-- Immutable audit log of all credit changes
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  balance_after integer not null,
  type text not null check (type in ('purchase', 'free_grant', 'generation')),
  reference_id text,
  description text,
  created_at timestamptz default now() not null
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select using (auth.uid() = user_id);

create index idx_credit_tx_user on public.credit_transactions(user_id, created_at desc);

-- Stripe purchase records (prevents double fulfillment)
create table public.stripe_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_session_id text unique not null,
  credits_amount integer not null,
  amount_nok integer not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now() not null
);

alter table public.stripe_purchases enable row level security;

create policy "Users can view own purchases"
  on public.stripe_purchases for select using (auth.uid() = user_id);

-- Atomic credit deduction with row locking
create or replace function public.deduct_credits(p_user_id uuid, p_amount integer, p_reference_id text)
returns integer
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  select balance into v_balance
  from public.user_credits
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return -1;
  end if;

  update public.user_credits
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, balance_after, type, reference_id, description)
  values (p_user_id, -p_amount, v_balance - p_amount, 'generation', p_reference_id, 'Bildegenerering');

  return v_balance - p_amount;
end;
$$;

-- Atomic credit addition (upserts user_credits row)
create or replace function public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_reference_id text, p_description text)
returns integer
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  insert into public.user_credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update set balance = user_credits.balance + p_amount, updated_at = now();

  select balance into v_balance from public.user_credits where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, balance_after, type, reference_id, description)
  values (p_user_id, p_amount, v_balance, p_type, p_reference_id, p_description);

  return v_balance;
end;
$$;
