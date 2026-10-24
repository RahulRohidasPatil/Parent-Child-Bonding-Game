create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  username text,
  account_type text not null default 'parent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select to authenticated using (id = auth.uid());

insert into public.profiles (id, email, display_name, username, account_type)
select id, email,
  nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
  nullif(trim(raw_user_meta_data ->> 'username'), ''),
  'parent'
from auth.users
where raw_user_meta_data ->> 'account_type' = 'parent'
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  username = excluded.username,
  updated_at = now();

create or replace function public.handle_parent_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ->> 'account_type' = 'parent' then
    insert into public.profiles (id, email, display_name, username, account_type)
    values (new.id, new.email,
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'parent')
    on conflict (id) do update set email = excluded.email, display_name = excluded.display_name, username = excluded.username, updated_at = now();
  end if;
  return new;
end;
$$;
