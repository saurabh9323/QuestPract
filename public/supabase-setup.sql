-- Quest90. Run once in your Supabase project's SQL Editor.
-- Progress, finalized course start date, answers, task history, notes and review dates live in this JSONB document.
-- Email/password accounts are handled by Supabase Auth; passwords are never stored in these tables.
-- A revision check prevents silent overwrites from concurrent tabs or devices.
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
