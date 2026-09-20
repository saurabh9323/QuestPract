-- Quest90. Run once in your Supabase project's SQL Editor.
-- Progress, finalized course start date, answers, task history, notes and review dates live in this JSONB document.
-- Email/password accounts are handled by Supabase Auth; passwords are never stored in these tables.
-- A revision check prevents silent overwrites from concurrent tabs or devices.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  experience_years numeric(4,1),
  target_role text default 'Full-stack Developer',
  communication_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$'),
  constraint full_name_length check (full_name is null or char_length(full_name) <= 120),
  constraint target_role_length check (target_role is null or char_length(target_role) <= 120),
  constraint communication_goal_length check (communication_goal is null or char_length(communication_goal) <= 1000)
);
alter table public.user_profiles enable row level security;
drop policy if exists "Read own profile" on public.user_profiles;
create policy "Read own profile" on public.user_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own profile" on public.user_profiles;
create policy "Insert own profile" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own profile" on public.user_profiles;
create policy "Update own profile" on public.user_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.user_profiles to authenticated;
revoke all on public.user_profiles from anon;

create table if not exists public.training_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  course_start_date date,
  course_start_lock_key text,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint payload_object check (jsonb_typeof(payload) = 'object'),
  constraint payload_size check (octet_length(payload::text) <= 16000000)
);
alter table public.training_state enable row level security;
alter table public.training_state add column if not exists course_start_date date;
alter table public.training_state add column if not exists course_start_lock_key text;
alter table public.training_state drop constraint if exists payload_size;
alter table public.training_state add constraint payload_size check (octet_length(payload::text) <= 16000000);
alter table public.training_state drop constraint if exists course_start_lock_key_valid;
alter table public.training_state add constraint course_start_lock_key_valid check (course_start_lock_key is null or course_start_lock_key = 'course_start_locked_v1');
drop policy if exists "Read own training" on public.training_state;
create policy "Read own training" on public.training_state for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own training" on public.training_state;
create policy "Insert own training" on public.training_state for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own training" on public.training_state;
create policy "Update own training" on public.training_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own training" on public.training_state;
create policy "Delete own training" on public.training_state for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.training_state to authenticated;
revoke all on public.training_state from anon;

create or replace function public.save_training_state(new_payload jsonb, expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare next_revision integer;
declare current_payload jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if expected_revision < 0 or jsonb_typeof(new_payload) <> 'object' or new_payload->>'version' <> '1' then
    raise exception 'Invalid progress payload';
  end if;
  select payload into current_payload from public.training_state where user_id = auth.uid();
  if current_payload#>>'{enrollment,lockKey}' = 'course_start_locked_v1'
     and (
       new_payload->>'startDate' is distinct from current_payload->>'startDate'
       or new_payload#>>'{enrollment,lockKey}' is distinct from 'course_start_locked_v1'
       or coalesce(new_payload#>>'{enrollment,startDateChangeUsed}','false') <> 'true'
     ) then
    raise exception 'START_DATE_LOCKED';
  end if;
  insert into public.training_state(user_id,payload,course_start_date,course_start_lock_key,revision)
    values(auth.uid(),new_payload,(new_payload->>'startDate')::date,new_payload#>>'{enrollment,lockKey}',0) on conflict(user_id) do nothing;
  update public.training_state
    set payload = new_payload,
        course_start_date = (new_payload->>'startDate')::date,
        course_start_lock_key = new_payload#>>'{enrollment,lockKey}',
        revision = revision + 1,
        updated_at = now()
    where user_id = auth.uid() and revision = expected_revision
    returning revision into next_revision;
  if next_revision is null then raise exception 'STALE_REVISION'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_training_state(jsonb,integer) from public, anon;
grant execute on function public.save_training_state(jsonb,integer) to authenticated;

-- Screenshot records are separate so an image does not inflate every progress save.
create table if not exists public.training_images (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 context_id text not null check (length(context_id) between 1 and 160),
 name text not null check (length(name) <= 300),
 data_url text not null check (length(data_url) <= 3000000 and data_url ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'),
 created_at timestamptz not null default now()
);
create index if not exists training_images_owner_context on public.training_images(user_id,context_id);
alter table public.training_images enable row level security;
drop policy if exists "Own screenshots" on public.training_images;
create policy "Own screenshots" on public.training_images for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.training_images to authenticated;
revoke all on public.training_images from anon;

-- Account safety migration (also available as a standalone file).
-- Run in Supabase SQL Editor after supabase-setup.sql on an existing Quest90 project.
-- Additive migration: it preserves progress, existing identities, screenshots and start locks.
begin;

alter table public.user_profiles add column if not exists target_companies text;
alter table public.user_profiles add column if not exists weak_areas jsonb not null default '[]'::jsonb;
alter table public.user_profiles add column if not exists daily_minutes integer not null default 180;

-- Use the Supabase Auth UUID as the single identity throughout the application.
insert into public.user_profiles(user_id) select id from auth.users on conflict(user_id) do nothing;

create or replace function public.quest90_create_profile()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.user_profiles(user_id) values(new.id) on conflict(user_id) do nothing;
 return new;
end;
$$;
revoke all on function public.quest90_create_profile() from public,anon,authenticated;
drop trigger if exists quest90_user_created on auth.users;
create trigger quest90_user_created after insert on auth.users for each row execute function public.quest90_create_profile();

do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.training_state'::regclass and conname='training_state_profile_fk') then
  alter table public.training_state add constraint training_state_profile_fk foreign key(user_id) references public.user_profiles(user_id) on delete cascade;
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.training_images'::regclass and conname='training_images_profile_fk') then
  alter table public.training_images add constraint training_images_profile_fk foreign key(user_id) references public.user_profiles(user_id) on delete cascade;
 end if;
end $$;

create table if not exists public.training_state_history(
 user_id uuid not null references public.user_profiles(user_id) on delete cascade,
 revision integer not null,
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 saved_at timestamptz not null default now(),
 primary key(user_id,revision)
);
alter table public.training_state_history enable row level security;
drop policy if exists "Read own recovery history" on public.training_state_history;
create policy "Read own recovery history" on public.training_state_history for select to authenticated using((select auth.uid())=user_id);
revoke all on public.training_state_history from anon,authenticated;
grant select on public.training_state_history to authenticated;
insert into public.training_state_history(user_id,revision,payload,saved_at)
 select user_id,revision,payload,updated_at from public.training_state on conflict do nothing;

create or replace function public.quest90_archive_progress()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  insert into public.training_state_history(user_id,revision,payload,saved_at)
   values(old.user_id,old.revision,old.payload,old.updated_at) on conflict do nothing;
 end if;
 insert into public.training_state_history(user_id,revision,payload,saved_at)
  values(new.user_id,new.revision,new.payload,new.updated_at) on conflict do nothing;
 return new;
end;
$$;
revoke all on function public.quest90_archive_progress() from public,anon,authenticated;
drop trigger if exists quest90_progress_archived on public.training_state;
create trigger quest90_progress_archived after insert or update on public.training_state for each row execute function public.quest90_archive_progress();

-- Save profile and progress in the same transaction. Ordinary clients cannot bypass
-- the revision or course-start checks through direct table writes.
create or replace function public.save_training_state(new_payload jsonb,expected_revision integer)
returns integer language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();
declare previous public.training_state%rowtype;
declare next_revision integer;
declare profile jsonb;
begin
 if owner_id is null then raise exception 'Authentication required'; end if;
 if expected_revision is null or expected_revision<0 or new_payload is null
  or jsonb_typeof(new_payload) is distinct from 'object'
  or new_payload->>'version' is distinct from '1'
  or jsonb_typeof(new_payload->'days') is distinct from 'object'
  or new_payload->>'startDate' is null then raise exception 'Invalid progress payload'; end if;
 insert into public.user_profiles(user_id) values(owner_id) on conflict(user_id) do nothing;
 -- Lock the owning profile even for the very first course save, avoiding insert races.
 perform user_id from public.user_profiles where user_id=owner_id for update;
 select * into previous from public.training_state where user_id=owner_id for update;
 if coalesce(previous.revision,0)<>expected_revision then raise exception 'STALE_REVISION'; end if;
 if previous.payload#>>'{enrollment,lockKey}'='course_start_locked_v1' and (
  new_payload->>'startDate' is distinct from previous.payload->>'startDate'
  or new_payload#>>'{enrollment,lockKey}' is distinct from 'course_start_locked_v1'
  or new_payload#>>'{enrollment,startDateChangeUsed}' is distinct from 'true'
 ) then raise exception 'START_DATE_LOCKED'; end if;
 profile:=new_payload->'profile';
 if jsonb_typeof(profile)='object' then
  update public.user_profiles set
   username=nullif(profile->>'username',''),
   full_name=nullif(profile->>'fullName',''),
   experience_years=nullif(profile->>'experienceYears','')::numeric,
   target_role=coalesce(nullif(profile->>'targetRole',''),'Full-stack Developer'),
   communication_goal=profile->>'communicationGoal',
   target_companies=profile->>'targetCompanies',
   weak_areas=coalesce(profile->'weakAreas','[]'::jsonb),
   daily_minutes=coalesce((profile->>'dailyMinutes')::integer,180),
   updated_at=now()
  where user_id=owner_id;
 end if;
 next_revision:=expected_revision+1;
 insert into public.training_state(user_id,payload,course_start_date,course_start_lock_key,revision,updated_at)
 values(owner_id,new_payload,(new_payload->>'startDate')::date,new_payload#>>'{enrollment,lockKey}',next_revision,now())
 on conflict(user_id) do update set payload=excluded.payload,course_start_date=excluded.course_start_date,
  course_start_lock_key=excluded.course_start_lock_key,revision=excluded.revision,updated_at=excluded.updated_at;
 return next_revision;
end;
$$;
revoke all on function public.save_training_state(jsonb,integer) from public,anon;
grant execute on function public.save_training_state(jsonb,integer) to authenticated;
revoke insert,update,delete on public.training_state from authenticated;
grant select on public.training_state to authenticated;
commit;
