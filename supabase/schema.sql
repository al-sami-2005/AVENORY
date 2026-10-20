-- Ninety 3.0 — Deploy in the Supabase SQL editor once.
-- Each user has exactly one privately accessible snapshot of their 90-day tracker.
-- This is NOT an end-to-end encrypted vault; authorized database operators still can access database data.
create table if not exists public.ninety_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1 check(revision>=1),
  updated_at timestamptz not null default now(),
  constraint ninety_json_object check (jsonb_typeof(data)='object'),
  constraint ninety_size_limit check (pg_column_size(data)<2000000)
);

alter table public.ninety_profiles enable row level security;
-- A user may access ONLY their own snapshot. The key is public; RLS is the protection.
drop policy if exists "ninety_select_own" on public.ninety_profiles;
create policy "ninety_select_own" on public.ninety_profiles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "ninety_insert_own" on public.ninety_profiles;
create policy "ninety_insert_own" on public.ninety_profiles for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "ninety_update_own" on public.ninety_profiles;
create policy "ninety_update_own" on public.ninety_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

revoke all on public.ninety_profiles from anon;
grant select,insert,update on public.ninety_profiles to authenticated;
-- No direct delete policy or grant.

-- Atomic compare-and-swap. Prevents two devices from silently overwriting each other.
-- The frontend POSTs: {"p_document": { ... }, "p_expected_revision": 0 | 1 | 2 ... }
-- If this returns [] the revision was stale. UI forces an explicit resolution.
create or replace function public.ninety_write_state(p_document jsonb,p_expected_revision integer)
returns table(revision integer)
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_document) <> 'object' or pg_column_size(p_document) >= 2000000 then raise exception 'Invalid or oversized tracker data'; end if;
  if p_expected_revision is null or p_expected_revision < 0 then raise exception 'Invalid revision'; end if;
  return query
  insert into public.ninety_profiles as p (user_id,data,revision,updated_at)
    values (auth.uid(),p_document,1,now())
  on conflict (user_id) do update
    set data=excluded.data,revision=p.revision+1,updated_at=now()
    where p.revision=p_expected_revision
  returning p.revision;
end;
$$;
revoke all on function public.ninety_write_state(jsonb,integer) from public,anon;
grant execute on function public.ninety_write_state(jsonb,integer) to authenticated;

notify pgrst, 'reload schema';
