create table if not exists public.parent_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  username text,
  account_type text not null default 'parent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists account_type text not null default 'parent';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.parent_profiles add column if not exists display_name text;
alter table public.parent_profiles add column if not exists username text;
alter table public.parent_profiles add column if not exists created_at timestamptz not null default now();
alter table public.parent_profiles add column if not exists updated_at timestamptz not null default now();
create unique index if not exists parent_profiles_username_key on public.parent_profiles (username) where username is not null;

alter table public.parent_profiles enable row level security;
alter table public.profiles enable row level security;

drop policy if exists parent_profiles_self_select on public.parent_profiles;
create policy parent_profiles_self_select
  on public.parent_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create or replace function public.handle_parent_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ->> 'account_type' = 'parent' then
    insert into public.profiles (id, email, display_name, username, account_type)
    values (
      new.id,
      new.email,
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      'parent'
    )
    on conflict (id) do update set
      email = excluded.email,
      display_name = excluded.display_name,
      username = excluded.username,
      updated_at = now();

    insert into public.parent_profiles (user_id, display_name, username)
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'username'), '')
    )
    on conflict (user_id) do update set
      display_name = excluded.display_name,
      username = excluded.username,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_parent_signup on auth.users;
create trigger on_parent_signup
  after insert on auth.users
  for each row execute function public.handle_parent_signup();
