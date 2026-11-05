begin;
create table private.company_provision_requests(
 actor_id uuid not null references auth.users(id),request_id uuid not null,
 payload jsonb not null,fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 tenant_id uuid references public.tenants(id),created_at timestamptz not null default now(),
 primary key(actor_id,request_id)
);
revoke all on private.company_provision_requests from public,anon,authenticated;

create function private.validate_company_input(p_input jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare k text;
begin
 perform private.check_json(p_input,array['name','unit','locale','country','currency','timezone','plan_id','owner_email','owner_mode'],array['name','unit','locale','country','currency','timezone','plan_id','owner_email','owner_mode']);
 foreach k in array array['name','unit','locale','country','currency','timezone','plan_id','owner_email','owner_mode'] loop
  if jsonb_typeof(p_input->k)<>'string' then raise exception 'Invalid company field' using errcode='22023';end if;
 end loop;
 if length(trim(p_input->>'name')) not between 2 and 100 or length(trim(p_input->>'unit')) not between 2 and 100
 or p_input->>'locale' not in ('pt-BR','pt-PT') or p_input->>'country' not in ('BR','PT')
 or p_input->>'currency' not in ('BRL','EUR') or p_input->>'timezone' not in ('America/Sao_Paulo','Europe/Lisbon')
 or p_input->>'owner_mode' not in ('new','existing') or length(p_input->>'owner_email')>254
 or p_input->>'owner_email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 then raise exception 'Invalid company fields' using errcode='22023';end if;
 if not exists(select 1 from public.saas_plans where id=(p_input->>'plan_id')::uuid and published) then raise exception 'Select a published plan' using errcode='22023';end if;
end;$$;
revoke all on function private.validate_company_input(jsonb) from public,anon,authenticated;

create function public.platform_prepare_company(p_request uuid,p_input jsonb,p_fingerprint text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();r private.company_provision_requests%rowtype;u auth.users%rowtype;marker text;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 if p_request is null or p_fingerprint is null or p_fingerprint!~'^[a-f0-9]{64}$' then raise exception 'Invalid request' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('company-provision:'||actor::text,0));
 select * into r from private.company_provision_requests where actor_id=actor and request_id=p_request;
 if found then
  if r.payload<>p_input or r.fingerprint<>p_fingerprint then raise exception 'Request key reused' using errcode='40001';end if;
  if r.tenant_id is not null then return jsonb_build_object('tenant_id',r.tenant_id);end if;
 else
  if (select count(*) from private.company_provision_requests where actor_id=actor and created_at>now()-interval '1 hour')>=20 then raise exception 'Provision rate limit reached' using errcode='54000';end if;
 end if;
 perform private.validate_company_input(p_input);
 marker:=actor::text||':'||p_request::text;
 select * into u from auth.users where lower(email)=lower(trim(p_input->>'owner_email'));
 if p_input->>'owner_mode'='existing' then
  if u.id is null or u.email_confirmed_at is null then raise exception 'Existing owner account unavailable' using errcode='P0002';end if;
 elsif u.id is not null and u.raw_app_meta_data->>'platform_provision_request' is distinct from marker then
  raise exception 'Owner email already registered' using errcode='23505';
 end if;
 if u.id is not null and exists(select 1 from private.platform_operators where user_id=u.id and active) then raise exception 'Use a separate owner account' using errcode='23514';end if;
 insert into private.company_provision_requests(actor_id,request_id,payload,fingerprint) values(actor,p_request,p_input,p_fingerprint) on conflict do nothing;
 return jsonb_build_object('owner_id',u.id,'tenant_id',null);
end;$$;

create function public.platform_finish_company(p_request uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();r private.company_provision_requests%rowtype;u auth.users%rowtype;p public.saas_plans%rowtype;t uuid;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('company-provision:'||actor::text,0));
 select * into r from private.company_provision_requests where actor_id=actor and request_id=p_request for update;
 if not found then raise exception 'Prepare company request first' using errcode='22023';end if;
 if r.tenant_id is not null then return r.tenant_id;end if;
 perform private.validate_company_input(r.payload);
 select * into u from auth.users where lower(email)=lower(trim(r.payload->>'owner_email')) and email_confirmed_at is not null;
 if u.id is null then raise exception 'Owner account unavailable' using errcode='P0002';end if;
 if r.payload->>'owner_mode'='new' and u.raw_app_meta_data->>'platform_provision_request' is distinct from actor::text||':'||p_request::text then raise exception 'Owner request mismatch' using errcode='23505';end if;
 if exists(select 1 from private.platform_operators where user_id=u.id and active) then raise exception 'Use a separate owner account' using errcode='23514';end if;
 perform pg_advisory_xact_lock(hashtextextended(u.id::text,0));
 if (select count(*) from public.memberships where user_id=u.id and role='owner')>=10 then raise exception 'Owner establishment safety limit reached' using errcode='23514';end if;
 select * into p from public.saas_plans where id=(r.payload->>'plan_id')::uuid and published for share;
 if not found then raise exception 'Select a published plan' using errcode='22023';end if;
 insert into public.tenants(name,locale,country,currency,timezone) values(trim(r.payload->>'name'),r.payload->>'locale',r.payload->>'country',r.payload->>'currency',r.payload->>'timezone') returning id into t;
 insert into public.units(tenant_id,name) values(t,trim(r.payload->>'unit'));
 insert into public.memberships(tenant_id,user_id,role) values(t,u.id,'owner');
 insert into public.saas_subscriptions(tenant_id,plan_id,plan_snapshot,state,period_start,period_end)
 values(t,p.id,to_jsonb(p),case when p.trial_days>0 then 'trialing' else 'pending' end,now(),case when p.trial_days>0 then now()+make_interval(days=>p.trial_days) else null end);
 insert into public.audit_events(tenant_id,actor_id,action) values(t,actor,'establishment.created-by-platform');
 insert into private.platform_audit(actor_id,tenant_id,action,details) values(actor,t,'company.manually-provisioned',jsonb_build_object('owner_id',u.id,'owner_mode',r.payload->>'owner_mode','plan_id',p.id));
 update private.company_provision_requests set tenant_id=t where actor_id=actor and request_id=p_request;
 return t;
end;$$;
revoke all on function public.platform_prepare_company(uuid,jsonb,text),public.platform_finish_company(uuid) from public,anon;
grant execute on function public.platform_prepare_company(uuid,jsonb,text),public.platform_finish_company(uuid) to authenticated;
commit;
