begin;
create table public.member_invitations (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 email text not null check(length(email)<=254 and position('@' in email)>1),role public.member_role not null check(role<>'owner'),
 token_hash bytea not null unique,created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '48 hours',accepted_at timestamptz
);
alter table public.member_invitations enable row level security;
revoke all on public.member_invitations from anon,authenticated;
-- No direct token or email enumeration, even for other members. Creation returns token once.
create function public.create_member_invitation(p_tenant uuid,p_email text,p_role public.member_role) returns text
language plpgsql security definer set search_path='' as $$
declare v_token text;v_email text:=lower(trim(p_email));
begin
 if not private.has_role(p_tenant,array['owner']::public.member_role[]) then raise exception 'Forbidden' using errcode='42501';end if;
 if p_role is null or p_role='owner' or v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid invitation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,1));
 if (select count(*) from public.member_invitations where tenant_id=p_tenant and created_at>now()-interval '1 hour')>=20 then raise exception 'Invitation limit' using errcode='23514';end if;
 v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.member_invitations(tenant_id,email,role,token_hash,created_by) values(p_tenant,v_email,p_role,sha256(convert_to(v_token,'UTF8')),auth.uid());
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'member.invited');
 return v_token;
end;
$$;
create function public.accept_member_invitation(p_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_inv public.member_invitations%rowtype;v_email text;v_verified timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_token is null or length(p_token)<>64 then raise exception 'Invalid invitation' using errcode='22023';end if;
 select lower(email),email_confirmed_at into v_email,v_verified from auth.users where id=auth.uid();
 select * into v_inv from public.member_invitations where token_hash=sha256(convert_to(p_token,'UTF8')) for update;
 if not found or v_inv.email is distinct from v_email or v_verified is null or v_inv.expires_at<=now() or v_inv.accepted_at is not null then raise exception 'Invitation unavailable' using errcode='42501';end if;
 -- Revoked inviter permissions invalidate pending invitations.
 if not exists(select 1 from public.memberships where tenant_id=v_inv.tenant_id and user_id=v_inv.created_by and role='owner' and active) then raise exception 'Invitation unavailable' using errcode='42501';end if;
 -- Never overwrite an existing membership or escalate its role.
 insert into public.memberships(tenant_id,user_id,role) values(v_inv.tenant_id,auth.uid(),v_inv.role) on conflict do nothing;
 update public.member_invitations set accepted_at=now() where id=v_inv.id;
 insert into public.audit_events(tenant_id,actor_id,action) values(v_inv.tenant_id,auth.uid(),'member.invitation_accepted');
 return v_inv.tenant_id;
end;
$$;
revoke all on function public.create_member_invitation(uuid,text,public.member_role),public.accept_member_invitation(text) from public,anon;
grant execute on function public.create_member_invitation(uuid,text,public.member_role),public.accept_member_invitation(text) to authenticated;
commit;
