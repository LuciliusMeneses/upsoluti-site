begin;
create table private.platform_operators(user_id uuid primary key references auth.users(id),active boolean not null default true,created_at timestamptz not null default now());
create table private.platform_audit(id bigint generated always as identity primary key,actor_id uuid references auth.users(id),tenant_id uuid references public.tenants(id),action text not null,reason text not null default '',details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.saas_plans(
 id uuid primary key default gen_random_uuid(),code text not null check(code ~ '^[a-z0-9-]{2,50}$'),revision int not null,
 name text not null check(length(trim(name)) between 2 and 100),price_cents int not null check(price_cents between 0 and 100000000),currency text not null check(currency in ('BRL','EUR')),
 interval_months int not null check(interval_months in (1,12)),trial_days int not null check(trial_days between 0 and 90),grace_days int not null check(grace_days between 0 and 60),
 max_units int not null check(max_units between 1 and 10000),max_professionals int not null check(max_professionals between 1 and 10000),max_members int not null check(max_members between 1 and 10000),
 features text[] not null default '{}',published boolean not null default false,created_at timestamptz not null default now(),unique(code,revision),
 check(features <@ array['settings','team','catalog','appointments','clients','packages','finance','reports','communication']::text[])
);
create table public.saas_subscriptions(
 tenant_id uuid primary key references public.tenants(id),plan_id uuid references public.saas_plans(id),plan_snapshot jsonb,
 state text not null check(state in ('pending','trialing','active','past_due','cancelled')),
 period_start timestamptz,period_end timestamptz,grace_until timestamptz,cancel_at_period_end boolean not null default false,
 version int not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(state not in ('trialing','active','past_due') or (plan_id is not null and plan_snapshot is not null and period_end>period_start)),
 check(grace_until is null or grace_until>=period_start)
);
create table private.provision_requests(actor_id uuid not null references auth.users(id),request_id uuid not null,payload jsonb not null,tenant_id uuid not null references public.tenants(id),primary key(actor_id,request_id));
create table private.unit_requests(tenant_id uuid not null references public.tenants(id),request_id uuid not null,actor_id uuid not null references auth.users(id),name text not null,unit_id uuid not null references public.units(id),primary key(tenant_id,request_id));
insert into public.saas_subscriptions(tenant_id,state) select id,'pending' from public.tenants;
revoke all on private.platform_operators,private.platform_audit,private.provision_requests,private.unit_requests from public,anon,authenticated;
alter table public.saas_plans enable row level security;
alter table public.saas_subscriptions enable row level security;
revoke all on public.saas_plans,public.saas_subscriptions from anon,authenticated;
grant select on public.saas_plans,public.saas_subscriptions to authenticated;
create policy published_plans on public.saas_plans for select to authenticated using(published);
create policy own_subscription on public.saas_subscriptions for select to authenticated using(private.has_role(tenant_id,array['owner','manager','reception','professional']::public.member_role[]));

create function private.is_platform_operator() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.platform_operators where user_id=auth.uid() and active);
$$;
create function public.platform_access() returns boolean language sql stable security definer set search_path='' as $$select private.is_platform_operator();$$;
create function private.check_json(p_input jsonb,p_allowed text[],p_required text[]) returns void language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(p_input) is distinct from 'object' then raise exception 'Invalid object' using errcode='22023';end if;
 if octet_length(p_input::text)>12000 or not p_input ?& p_required or exists(select 1 from jsonb_object_keys(p_input) k where not k=any(p_allowed)) then raise exception 'Invalid fields' using errcode='22023';end if;
end;
$$;
create function public.public_plan_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(p) order by p.currency,p.price_cents,p.name),'[]') from public.saas_plans p where published;
$$;
create function public.platform_create_plan(p_input jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_revision int;v_key text;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 perform private.check_json(p_input,array['code','name','price_cents','currency','interval_months','trial_days','grace_days','max_units','max_professionals','max_members','features','published'],array['code','name','price_cents','currency','interval_months','trial_days','grace_days','max_units','max_professionals','max_members','features','published']);
 foreach v_key in array array['code','name','currency'] loop if jsonb_typeof(p_input->v_key)<>'string' then raise exception 'Invalid text field' using errcode='22023';end if;end loop;
 foreach v_key in array array['price_cents','interval_months','trial_days','grace_days','max_units','max_professionals','max_members'] loop if jsonb_typeof(p_input->v_key)<>'number' or (p_input->>v_key)!~'^[0-9]+$' then raise exception 'Invalid integer field' using errcode='22023';end if;end loop;
 if jsonb_typeof(p_input->'features')<>'array' or jsonb_typeof(p_input->'published')<>'boolean' then raise exception 'Invalid features' using errcode='22023';end if;
 if exists(select 1 from jsonb_array_elements(p_input->'features') v where jsonb_typeof(v)<>'string') then raise exception 'Invalid feature type' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('plan:'||(p_input->>'code'),0));
 select coalesce(max(revision),0)+1 into v_revision from public.saas_plans where code=p_input->>'code';
 insert into public.saas_plans(code,revision,name,price_cents,currency,interval_months,trial_days,grace_days,max_units,max_professionals,max_members,features,published)
 values(p_input->>'code',v_revision,trim(p_input->>'name'),(p_input->>'price_cents')::int,p_input->>'currency',(p_input->>'interval_months')::int,(p_input->>'trial_days')::int,(p_input->>'grace_days')::int,(p_input->>'max_units')::int,(p_input->>'max_professionals')::int,(p_input->>'max_members')::int,array(select jsonb_array_elements_text(p_input->'features')),(p_input->>'published')::boolean) returning id into v_id;
 insert into private.platform_audit(actor_id,action,details) values(auth.uid(),'plan.created',jsonb_build_object('plan_id',v_id,'revision',v_revision));return v_id;
end;
$$;
create function public.platform_publish_plan(p_plan uuid,p_published boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 if p_published is null then raise exception 'Invalid visibility' using errcode='22023';end if;
 update public.saas_plans set published=p_published where id=p_plan;
 if not found then raise exception 'Plan unavailable' using errcode='22023';end if;
 insert into private.platform_audit(actor_id,action,details) values(auth.uid(),'plan.visibility',jsonb_build_object('plan_id',p_plan,'published',p_published));
end;
$$;
create function private.subscription_context(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.saas_subscriptions%rowtype;effective text;writable boolean;units_used int;members_used int;
begin
 select * into s from public.saas_subscriptions where tenant_id=p_tenant;
 if not found then return jsonb_build_object('effective_state','pending','writable',false);end if;
 effective:=s.state;
 if s.cancel_at_period_end and now()>=s.period_end then effective:='cancelled';
 elsif s.state in ('active','trialing') and (s.period_end is null or now()>=s.period_end) then effective:='expired';
 elsif s.state='past_due' and (s.grace_until is null or now()>=s.grace_until) then effective:='restricted';end if;
 writable:=effective in ('active','trialing') or (effective='past_due' and s.grace_until>now());
 select count(*) into units_used from public.units where tenant_id=p_tenant;
 select count(*) into members_used from public.memberships where tenant_id=p_tenant and active;
 return to_jsonb(s)||jsonb_build_object('effective_state',effective,'writable',writable,'units_used',units_used,'members_used',members_used,'professional_usage',null,'billing_mode','manual','payment_received',null);
end;
$$;
create function public.tenant_subscription(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.has_role(p_tenant,array['owner','manager','reception','professional']::public.member_role[]) then raise exception 'Tenant access required' using errcode='42501';end if;
 return private.subscription_context(p_tenant);
end;
$$;
create function private.assert_entitlement(p_tenant uuid,p_feature text,p_resource text default null,p_add int default 0) returns void language plpgsql security definer set search_path='' as $$
declare c jsonb;v_limit int;v_used int;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));c:=private.subscription_context(p_tenant);
 if not coalesce((c->>'writable')::boolean,false) then raise exception 'Subscription is read only; contact platform administrator' using errcode='42501';end if;
 if not coalesce((c->'plan_snapshot'->'features') ? p_feature,false) then raise exception 'Feature not included in plan' using errcode='42501';end if;
 if p_add<0 then raise exception 'Invalid usage change' using errcode='22023';end if;
 if p_resource='units' then v_limit:=(c->'plan_snapshot'->>'max_units')::int;v_used:=(c->>'units_used')::int;
 elsif p_resource='members' then v_limit:=(c->'plan_snapshot'->>'max_members')::int;v_used:=(c->>'members_used')::int;
 elsif p_resource is not null then raise exception 'Resource integration unavailable' using errcode='22023';end if;
 if p_resource is not null and (v_limit is null or v_used+p_add>v_limit) then raise exception 'Plan limit reached' using errcode='23514';end if;
end;
$$;
create or replace function public.create_establishment(p_input jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;v_request uuid;v_plan public.saas_plans%rowtype;v_previous private.provision_requests%rowtype;v_key text;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform private.check_json(p_input,array['name','unit','locale','country','currency','timezone','plan_id','request_id'],array['name','unit','locale','country','currency','timezone','plan_id','request_id']);
 foreach v_key in array array['name','unit','locale','country','currency','timezone','plan_id','request_id'] loop if jsonb_typeof(p_input->v_key)<>'string' then raise exception 'Invalid text field' using errcode='22023';end if;end loop;
 v_request:=(p_input->>'request_id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 select * into v_previous from private.provision_requests where actor_id=v_user and request_id=v_request;
 if found then if v_previous.payload<>p_input then raise exception 'Request key reused' using errcode='22023';end if;return v_previous.tenant_id;end if;
 if (select count(*) from public.memberships where user_id=v_user and role='owner')>=10 then raise exception 'Account establishment safety limit reached' using errcode='23514';end if;
 if length(trim(p_input->>'name')) not between 2 and 100 or length(trim(p_input->>'unit')) not between 2 and 100 then raise exception 'Invalid name' using errcode='22023';end if;
 select * into v_plan from public.saas_plans where id=(p_input->>'plan_id')::uuid and published for share;
 if not found then raise exception 'Select an available plan' using errcode='22023';end if;
 insert into public.tenants(name,locale,country,currency,timezone) values(trim(p_input->>'name'),p_input->>'locale',p_input->>'country',p_input->>'currency',p_input->>'timezone') returning id into v_id;
 insert into public.memberships(tenant_id,user_id,role) values(v_id,v_user,'owner');
 insert into public.units(tenant_id,name) values(v_id,trim(p_input->>'unit'));
 insert into public.saas_subscriptions(tenant_id,plan_id,plan_snapshot,state,period_start,period_end)
 values(v_id,v_plan.id,to_jsonb(v_plan),case when v_plan.trial_days>0 then 'trialing' else 'pending' end,now(),case when v_plan.trial_days>0 then now()+make_interval(days=>v_plan.trial_days) else null end);
 insert into public.audit_events(tenant_id,actor_id,action) values(v_id,v_user,'establishment.created');
 insert into private.platform_audit(actor_id,tenant_id,action) values(v_user,v_id,'subscription.provisioned');
 insert into private.provision_requests(actor_id,request_id,payload,tenant_id) values(v_user,v_request,p_input,v_id);return v_id;
end;
$$;
create function public.platform_set_subscription(p_tenant uuid,p_input jsonb) returns void language plpgsql security definer set search_path='' as $$
declare s public.saas_subscriptions%rowtype;p public.saas_plans%rowtype;v_end timestamptz;v_state text;v_reason text;v_snapshot jsonb;v_cancel boolean;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 perform private.check_json(p_input,array['version','plan_id','state','period_end','cancel_at_period_end','reason'],array['version','state','period_end','cancel_at_period_end','reason']);
 if jsonb_typeof(p_input->'version')<>'number' or (p_input->>'version')!~'^[0-9]+$' or jsonb_typeof(p_input->'state')<>'string' or jsonb_typeof(p_input->'reason')<>'string' or jsonb_typeof(p_input->'cancel_at_period_end')<>'boolean' or jsonb_typeof(p_input->'period_end')<>'string' then raise exception 'Invalid subscription fields' using errcode='22023';end if;
 v_state:=p_input->>'state';v_reason:=trim(p_input->>'reason');v_end:=(p_input->>'period_end')::timestamptz;v_cancel:=(p_input->>'cancel_at_period_end')::boolean;
 if v_state not in ('pending','trialing','active','past_due','cancelled') or length(v_reason) not between 5 and 300 or v_end<=now() or v_end>now()+interval '2 years' or v_cancel and v_state not in ('active','trialing') then raise exception 'Invalid state, reason or end date' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 select * into s from public.saas_subscriptions where tenant_id=p_tenant for update;
 if not found then raise exception 'Subscription unavailable' using errcode='22023';end if;
 if s.version<>(p_input->>'version')::int then raise exception 'Subscription changed; reload' using errcode='40001';end if;
 if p_input->>'plan_id' is not null and (p_input->>'plan_id')::uuid is distinct from s.plan_id then
  select * into p from public.saas_plans where id=(p_input->>'plan_id')::uuid;
  if not found then raise exception 'Plan unavailable' using errcode='22023';end if;v_snapshot:=to_jsonb(p);
 else
  if s.plan_id is null then raise exception 'A plan must be assigned' using errcode='22023';end if;
  v_snapshot:=s.plan_snapshot;
 end if;
 if v_state='trialing' and (v_snapshot->>'trial_days')::int=0 then raise exception 'Plan has no trial' using errcode='22023';end if;
 update public.saas_subscriptions set plan_id=(v_snapshot->>'id')::uuid,plan_snapshot=v_snapshot,state=v_state,period_start=now(),period_end=v_end,
 grace_until=case when v_state='past_due' then now()+make_interval(days=>(v_snapshot->>'grace_days')::int) else null end,cancel_at_period_end=v_cancel,version=version+1,updated_at=now() where tenant_id=p_tenant;
 insert into private.platform_audit(actor_id,tenant_id,action,reason,details) values(auth.uid(),p_tenant,'subscription.updated',v_reason,jsonb_build_object('previous_state',s.state,'state',v_state,'plan_id',v_snapshot->>'id','previous_version',s.version,'cancel_at_period_end',v_cancel));
end;
$$;
create function public.platform_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 select jsonb_build_object(
 'plans',coalesce((select jsonb_agg(to_jsonb(p) order by created_at desc) from public.saas_plans p),'[]'),
 'companies',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'locale',t.locale,'currency',t.currency,'timezone',t.timezone,'created_at',t.created_at,'subscription',private.subscription_context(t.id)) order by t.created_at desc) from public.tenants t),'[]'),
 'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.id desc) from (select id,actor_id,tenant_id,action,reason,details,created_at from private.platform_audit order by id desc limit 100) a),'[]'),
 'mrr',coalesce((select jsonb_agg(to_jsonb(m)) from (select s.plan_snapshot->>'currency' currency, sum((s.plan_snapshot->>'price_cents')::numeric/(s.plan_snapshot->>'interval_months')::numeric) cents from public.saas_subscriptions s where private.subscription_context(s.tenant_id)->>'effective_state'='active' group by s.plan_snapshot->>'currency') m),'[]'),
 'billing_mode','manual','support_access','not_implemented') into v_result;return v_result;
end;
$$;
create function public.create_tenant_unit(p_tenant uuid,p_request uuid,p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_old private.unit_requests%rowtype;v_id uuid;
begin
 if not private.has_role(p_tenant,array['owner','manager']::public.member_role[]) then raise exception 'Unit permission required' using errcode='42501';end if;
 if p_request is null or p_name is null or length(trim(p_name)) not between 2 and 100 then raise exception 'Invalid unit' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 select * into v_old from private.unit_requests where tenant_id=p_tenant and request_id=p_request;
 if found then if v_old.actor_id<>auth.uid() or v_old.name<>trim(p_name) then raise exception 'Request key reused' using errcode='22023';end if;return v_old.unit_id;end if;
 perform private.assert_entitlement(p_tenant,'settings','units',1);
 insert into public.units(tenant_id,name) values(p_tenant,trim(p_name)) returning id into v_id;
 insert into private.unit_requests(tenant_id,request_id,actor_id,name,unit_id) values(p_tenant,p_request,auth.uid(),trim(p_name),v_id);
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'unit.created');return v_id;
end;
$$;

-- Existing invitation logic is retained privately, with subscription checks around writes.
alter function public.create_member_invitation(uuid,text,public.member_role) set schema private;
alter function private.create_member_invitation(uuid,text,public.member_role) rename to create_member_invitation_base;
alter function public.accept_member_invitation(text) set schema private;
alter function private.accept_member_invitation(text) rename to accept_member_invitation_base;
revoke all on function private.create_member_invitation_base(uuid,text,public.member_role),private.accept_member_invitation_base(text) from public,anon,authenticated;
create function public.create_member_invitation(p_tenant uuid,p_email text,p_role public.member_role) returns text language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role(p_tenant,array['owner']::public.member_role[]) then raise exception 'Invitation permission required' using errcode='42501';end if;
 perform private.assert_entitlement(p_tenant,'team');
 return private.create_member_invitation_base(p_tenant,p_email,p_role);
end;
$$;
create function public.accept_member_invitation(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.member_invitations%rowtype;v_email text;v_verified timestamptz;
begin
 if auth.uid() is null or p_token is null or length(p_token)<>64 then raise exception 'Invitation unavailable' using errcode='42501';end if;
 select * into i from public.member_invitations where token_hash=sha256(convert_to(p_token,'UTF8'));
 select lower(email),email_confirmed_at into v_email,v_verified from auth.users where id=auth.uid();
 if i.id is null or v_email is distinct from i.email or v_verified is null then raise exception 'Invitation unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(i.tenant_id::text,77));
 if exists(select 1 from public.memberships where tenant_id=i.tenant_id and user_id=auth.uid() and not active) then raise exception 'Member inactive; contact administrator' using errcode='42501';end if;
 perform private.assert_entitlement(i.tenant_id,'team','members',case when exists(select 1 from public.memberships where tenant_id=i.tenant_id and user_id=auth.uid() and active) then 0 else 1 end);
 return private.accept_member_invitation_base(p_token);
end;
$$;
create function public.export_tenant_foundation(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.has_role(p_tenant,array['owner']::public.member_role[]) then raise exception 'Export permission required' using errcode='42501';end if;
 select jsonb_build_object('scope','foundation-only','exported_at',now(),'tenant',to_jsonb(t),'units',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'created_at',created_at)) from public.units where tenant_id=p_tenant),'[]'),'membership_counts',jsonb_build_object('active',(select count(*) from public.memberships where tenant_id=p_tenant and active)),'subscription',private.subscription_context(p_tenant)) into result from public.tenants t where id=p_tenant;
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'foundation.exported');return result;
end;
$$;
revoke all on function private.is_platform_operator(),private.check_json(jsonb,text[],text[]),private.subscription_context(uuid),private.assert_entitlement(uuid,text,text,int) from public,anon,authenticated;
revoke all on function public.platform_access(),public.public_plan_catalog(),public.platform_create_plan(jsonb),public.platform_publish_plan(uuid,boolean),public.platform_set_subscription(uuid,jsonb),public.platform_overview(),public.tenant_subscription(uuid),public.create_tenant_unit(uuid,uuid,text),public.export_tenant_foundation(uuid),public.create_member_invitation(uuid,text,public.member_role),public.accept_member_invitation(text) from public,anon;
grant execute on function public.public_plan_catalog() to anon,authenticated;
grant execute on function public.platform_access(),public.platform_create_plan(jsonb),public.platform_publish_plan(uuid,boolean),public.platform_set_subscription(uuid,jsonb),public.platform_overview(),public.tenant_subscription(uuid),public.create_tenant_unit(uuid,uuid,text),public.export_tenant_foundation(uuid),public.create_member_invitation(uuid,text,public.member_role),public.accept_member_invitation(text) to authenticated;
commit;
