-- Project-2 master database setup backup
-- Supabase project: Project-2
-- Keep this file as the record of database SQL used by the project.

-- 1. User profiles
create table public.profiles (id uuid primary key, balance numeric default 0, today_earnings numeric default 0, total_earnings numeric default 0, created_at timestamptz default now());

alter table public.profiles enable row level security;

create policy "view own profile" on public.profiles for select to authenticated using (auth.uid() = id);

-- 2. Automatically create a profile when a user registers
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id) values (new.id); return new; end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 3. Add profiles for users that already existed
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- 4. PTC advertisements
create table public.ptc_ads (id bigint generated always as identity primary key, title text not null, description text, url text not null, reward numeric not null default 1, duration_seconds integer not null default 10, active boolean not null default true, created_at timestamptz default now());

-- 5. PTC viewing history
create table public.ptc_views (id bigint generated always as identity primary key, user_id uuid not null, ad_id bigint not null, reward numeric not null, viewed_at timestamptz default now());

alter table public.ptc_views enable row level security;

create policy "view own ptc history" on public.ptc_views for select to authenticated using (auth.uid() = user_id);

-- 6. Five test advertisements
insert into public.ptc_ads (title, description, url, reward, duration_seconds, active) values ('Test Ad 1','Watch this advertisement for 10 seconds','https://example.com',5,10,true),('Test Ad 2','Watch this advertisement for 15 seconds','https://example.com',7,15,true),('Test Ad 3','Watch this advertisement for 10 seconds','https://example.com',5,10,true),('Test Ad 4','Watch this advertisement for 20 seconds','https://example.com',10,20,true),('Test Ad 5','Watch this advertisement for 15 seconds','https://example.com',8,15,true);

-- NOTE:
-- The commands above document the database setup already performed.
-- Do not blindly rerun one-time CREATE POLICY/CREATE TRIGGER commands on an existing database.
-- Real PTC rewards must be processed server-side; never trust browser JavaScript to change balances.


-- 7. Latest PTC security and cooldown updates
-- Add a 24-hour (configurable) cooldown per advertisement.
alter table public.ptc_ads add column if not exists cooldown_hours integer not null default 24;

-- Track start, claim, and cancelled viewing attempts.
alter table public.ptc_views add column if not exists started_at timestamptz;
alter table public.ptc_views add column if not exists claimed_at timestamptz;
alter table public.ptc_views add column if not exists cancelled_at timestamptz;

-- The client must not directly insert PTC viewing records.
drop policy if exists "users can start ptc ads" on public.ptc_views;

-- Authenticated users can view active advertisements.
alter table public.ptc_ads enable row level security;
drop policy if exists "authenticated users can view active ads" on public.ptc_ads;
create policy "authenticated users can view active ads"
on public.ptc_ads for select to authenticated
using (active = true);

-- Securely start an advertisement.
create or replace function public.start_ptc_ad(p_ad_id bigint)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_reward numeric;
begin
  if v_user_id is null then
    raise exception 'Not logged in';
  end if;

  select duration_seconds, reward
  into v_duration, v_reward
  from public.ptc_ads
  where id = p_ad_id
    and active = true;

  if not found then
    raise exception 'Advertisement not available';
  end if;

  if exists (
    select 1
    from public.ptc_views
    where user_id = v_user_id
      and ad_id = p_ad_id
      and claimed_at is null
      and cancelled_at is null
  ) then
    raise exception 'Advertisement already viewed or in progress';
  end if;

  if exists (
    select 1
    from public.ptc_views
    where user_id = v_user_id
      and ad_id = p_ad_id
      and claimed_at is not null
      and claimed_at > now() - make_interval(hours => (
        select cooldown_hours from public.ptc_ads where id = p_ad_id
      ))
  ) then
    raise exception 'Advertisement already viewed recently';
  end if;

  insert into public.ptc_views (user_id, ad_id, reward, started_at, viewed_at)
  values (v_user_id, p_ad_id, v_reward, now(), now());

  return v_duration;
end;
$function$;

-- Cancel an unfinished viewing attempt.
create or replace function public.cancel_ptc_ad(p_ad_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not logged in';
  end if;

  update public.ptc_views
  set cancelled_at = now()
  where id = (
    select id
    from public.ptc_views
    where user_id = v_user_id
      and ad_id = p_ad_id
      and claimed_at is null
      and cancelled_at is null
    order by started_at desc
    limit 1
  );
end;
$function$;

-- Securely claim a completed advertisement and record the transaction.
create or replace function public.claim_ptc_reward(p_ad_id bigint)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_reward numeric;
  v_duration integer;
  v_started_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not logged in';
  end if;

  select reward, duration_seconds
  into v_reward, v_duration
  from public.ptc_ads
  where id = p_ad_id
    and active = true;

  if not found then
    raise exception 'Advertisement not available';
  end if;

  select started_at
  into v_started_at
  from public.ptc_views
  where user_id = v_user_id
    and ad_id = p_ad_id
    and claimed_at is null
    and cancelled_at is null
  order by started_at desc
  limit 1;

  if v_started_at is null then
    raise exception 'Advertisement was not started';
  end if;

  if v_started_at + make_interval(secs => v_duration) > now() then
    raise exception 'Viewing time is not complete';
  end if;

  update public.ptc_views
  set claimed_at = now(),
      reward = v_reward
  where user_id = v_user_id
    and ad_id = p_ad_id
    and claimed_at is null
    and cancelled_at is null
    and started_at = v_started_at;

  if not found then
    raise exception 'Reward already claimed';
  end if;

  update public.profiles
  set balance = coalesce(balance, 0) + v_reward,
      today_earnings = coalesce(today_earnings, 0) + v_reward,
      total_earnings = coalesce(total_earnings, 0) + v_reward
  where id = v_user_id;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user_id, 'PTC', v_reward, 'PTC Ad #' || p_ad_id || ' reward');

  return v_reward;
end;
$function$;

grant execute on function public.start_ptc_ad(bigint) to authenticated;
grant execute on function public.cancel_ptc_ad(bigint) to authenticated;
grant execute on function public.claim_ptc_reward(bigint) to authenticated;

-- 8. Transaction history
create table if not exists public.transactions (
  id integer primary key,
  user_id uuid,
  type text,
  amount numeric,
  description text,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

drop policy if exists "users can view own transactions" on public.transactions;
create policy "users can view own transactions"
on public.transactions for select
to authenticated
using (auth.uid() = user_id);

-- Note: the live database currently has these columns nullable because the table
-- was created incrementally during setup. Tightening them can be done after
-- confirming existing rows contain valid values.
