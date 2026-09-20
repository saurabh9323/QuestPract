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
