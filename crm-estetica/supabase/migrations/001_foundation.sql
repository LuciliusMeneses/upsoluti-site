-- Apply to a dedicated Supabase project. No business/demo/customer data.
begin;
create schema if not exists private;
revoke all on schema private from public;
create type public.member_role as enum ('owner','manager','reception','professional');
create table public.tenants (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 2 and 100),
 locale text not null check(locale in ('pt-BR','pt-PT')),country text not null check(country in ('BR','PT')),
 currency text not null check(currency in ('BRL','EUR')),timezone text not null check(timezone in ('America/Sao_Paulo','Europe/Lisbon')),
 created_at timestamptz not null default now()
);
create table public.memberships (
 tenant_id uuid not null references public.tenants(id), user_id uuid not null references auth.users(id),
 role public.member_role not null, active boolean not null default true,
 primary key(tenant_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id) where active;
create table public.units (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 name text not null check(length(trim(name)) between 2 and 100),created_at timestamptz not null default now(),
 unique(tenant_id,id)
);
create table public.audit_events (
 id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id),
 actor_id uuid not null references auth.users(id),action text not null,created_at timestamptz not null default now()
);
create function private.has_role(p_tenant uuid,p_roles public.member_role[]) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m where m.tenant_id=p_tenant and m.user_id=auth.uid() and m.active and m.role=any(p_roles));
$$;
revoke all on function private.has_role(uuid,public.member_role[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_role(uuid,public.member_role[]) to authenticated;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.units enable row level security;
alter table public.audit_events enable row level security;
create policy tenant_read on public.tenants for select to authenticated using(private.has_role(id,array['owner','manager','reception','professional']::public.member_role[]));
create policy own_memberships on public.memberships for select to authenticated using(user_id=auth.uid() and active);
create policy units_read on public.units for select to authenticated using(private.has_role(tenant_id,array['owner','manager','reception','professional']::public.member_role[]));
create policy audit_read on public.audit_events for select to authenticated using(private.has_role(tenant_id,array['owner']::public.member_role[]));
-- All writes pass through narrowly scoped RPCs. No direct insert/update/delete grants.
revoke all on public.tenants,public.memberships,public.units,public.audit_events from anon,authenticated;
grant select on public.tenants,public.memberships,public.units,public.audit_events to authenticated;
create function public.create_establishment(p_input jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if jsonb_typeof(p_input) is distinct from 'object' or
    (p_input - array['name','unit','locale','country','currency','timezone']) <> '{}'::jsonb or
    not (p_input ?& array['name','unit','locale','country','currency','timezone']) then
   raise exception 'Invalid fields' using errcode='22023';
 end if;
 if length(trim(p_input->>'name')) not between 2 and 100 or length(trim(p_input->>'unit')) not between 2 and 100 then
   raise exception 'Invalid name' using errcode='22023';
 end if;
 -- Serialize account-level creation; avoid accidental runaway tenant creation.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 if (select count(*) from public.memberships where user_id=v_user and role='owner') >= 10 then
   raise exception 'Establishment limit reached' using errcode='23514';
 end if;
 insert into public.tenants(name,locale,country,currency,timezone)
 values(trim(p_input->>'name'),p_input->>'locale',p_input->>'country',p_input->>'currency',p_input->>'timezone') returning id into v_id;
 insert into public.memberships(tenant_id,user_id,role) values(v_id,v_user,'owner');
 insert into public.units(tenant_id,name) values(v_id,trim(p_input->>'unit'));
 insert into public.audit_events(tenant_id,actor_id,action) values(v_id,v_user,'establishment.created');
 return v_id;
end;
$$;
revoke all on function public.create_establishment(jsonb) from public,anon;
grant execute on function public.create_establishment(jsonb) to authenticated;
-- Private documents are not exposed until a domain-specific authorization policy exists.
insert into storage.buckets(id,name,public) values('establishment-private','establishment-private',false) on conflict(id) do nothing;
commit;
