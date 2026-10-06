-- Apply once in Supabase SQL Editor. No existing progress tables are modified.
create table if not exists public.quest90_coach_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key text not null check (request_key ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending','complete','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, request_key),
  check (result is null or octet_length(result::text) <= 160000)
);
create index if not exists quest90_coach_jobs_created on public.quest90_coach_jobs(created_at);
alter table public.quest90_coach_jobs enable row level security;
revoke all on public.quest90_coach_jobs from anon, authenticated;
grant all on public.quest90_coach_jobs to service_role;

create or replace function public.quest90_coach_reserve(p_user uuid, p_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.quest90_coach_jobs; day_start timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
begin
  if p_user is null or p_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request'; end if;
  -- Serialize reservations so parallel browser tabs cannot race the limits.
  perform pg_advisory_xact_lock(909006100);
  -- Only the transient provider cache expires. Account learning history is separate.
  delete from public.quest90_coach_jobs where created_at < now() - interval '7 days';
  select * into existing from public.quest90_coach_jobs where user_id=p_user and request_key=p_key;
  if found then return jsonb_build_object('status',existing.status,'result',existing.result); end if;
  if (select count(*) from public.quest90_coach_jobs where user_id=p_user and created_at>=day_start)>=10
     or (select count(*) from public.quest90_coach_jobs where created_at>=day_start)>=100 then
    return jsonb_build_object('status','limited');
  end if;
  insert into public.quest90_coach_jobs(user_id,request_key) values(p_user,p_key);
  return jsonb_build_object('status','reserved');
end;
$$;
revoke all on function public.quest90_coach_reserve(uuid,text) from public, anon, authenticated;
grant execute on function public.quest90_coach_reserve(uuid,text) to service_role;
