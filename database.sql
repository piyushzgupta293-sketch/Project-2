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
