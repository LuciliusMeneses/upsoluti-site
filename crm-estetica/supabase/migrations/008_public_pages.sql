begin;
alter table public.saas_plans drop constraint saas_plans_features_check;
alter table public.saas_plans add constraint saas_plans_features_check check(features <@ array['settings','team','catalog','appointments','clients','packages','finance','reports','communication','public_page','online_booking']::text[]);
create table public.tenant_pages(
 tenant_id uuid primary key references public.tenants(id),slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$' and slug not in ('app','api','platform','demo','planos','faq','admin','login')),
 title text not null check(length(trim(title)) between 2 and 100),description text not null default '' check(length(description)<=1500),address text not null default '' check(length(address)<=300),phone text not null default '' check(length(phone)<=40 and phone ~ '^[0-9+() .-]*$'),
 email text not null default '' check(length(email)<=254 and (email='' or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 logo_data text not null default '' check(octet_length(logo_data)<=280000 and (logo_data='' or logo_data ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$')),
 accent text not null default '#0d5c58' check(accent ~ '^#[0-9a-fA-F]{6}$'),
 service_ids uuid[] not null default '{}',professional_ids uuid[] not null default '{}',
 privacy_notice text not null check(length(trim(privacy_notice)) between 20 and 2000),
 published boolean not null default false,booking_enabled boolean not null default false,slug_locked boolean not null default false,
 lead_minutes int not null default 60 check(lead_minutes between 15 and 10080),window_days int not null default 30 check(window_days between 1 and 90),
 version int not null default 1,updated_by uuid not null references auth.users(id),updated_at timestamptz not null default now()
);
alter table public.tenant_pages enable row level security;
revoke all on public.tenant_pages from anon,authenticated;grant select on public.tenant_pages to authenticated;
create policy page_config_read on public.tenant_pages for select to authenticated using(private.has_role(tenant_id,array['owner','manager']::public.member_role[]));
create table private.booking_gateway_config(id int primary key check(id=1),key_hash bytea not null);
create table private.online_attempts(id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id),ip_hash text not null,contact_hash bytea not null,created_at timestamptz not null default now());
create index online_attempts_ip on private.online_attempts(ip_hash,created_at);
create index online_attempts_tenant on private.online_attempts(tenant_id,created_at);
create table private.online_requests(tenant_id uuid not null references public.tenants(id),request_id uuid not null,payload_hash bytea not null,ip_hash text not null,receipt jsonb not null,primary key(tenant_id,request_id));
revoke all on private.booking_gateway_config,private.online_attempts,private.online_requests from public,anon,authenticated;
create table public.online_bookings(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,appointment_id uuid not null,privacy_snapshot text not null,created_at timestamptz not null default now(),foreign key(tenant_id,appointment_id) references public.appointments(tenant_id,id),unique(tenant_id,appointment_id));
alter table public.online_bookings enable row level security;
revoke all on public.online_bookings from anon,authenticated;grant select on public.online_bookings to authenticated;
create policy online_booking_read on public.online_bookings for select to authenticated using(private.can_operate(tenant_id));
alter table public.appointments add column booking_source text not null default 'internal' check(booking_source in ('internal','online'));
alter table public.appointments alter column created_by drop not null;
alter table public.appointments add constraint appointment_actor_required check(booking_source='online' or created_by is not null);
alter table public.appointment_events alter column actor_id drop not null;
alter table public.appointment_events add column actor_kind text not null default 'member' check(actor_kind in ('member','public'));
alter table public.appointment_events add constraint appointment_event_actor_required check(actor_kind='public' or actor_id is not null);
alter table public.audit_events alter column actor_id drop not null;
create function public.save_tenant_page(p_tenant uuid,p_input jsonb) returns void language plpgsql security definer set search_path='' as $$
declare v_old public.tenant_pages%rowtype;v_slug text;v_published boolean;v_booking boolean;v_count int;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if not private.has_role(p_tenant,array['owner','manager']::public.member_role[]) then raise exception 'Page permission required' using errcode='42501';end if;
 perform private.assert_entitlement(p_tenant,'public_page');
 perform private.check_json(p_input||jsonb_build_object('logo_data',''),array['version','slug','title','description','address','phone','email','logo_data','accent','service_ids','professional_ids','privacy_notice','published','booking_enabled','lead_minutes','window_days'],array['version','slug','title','description','address','phone','email','logo_data','accent','service_ids','professional_ids','privacy_notice','published','booking_enabled','lead_minutes','window_days']);
 if octet_length(p_input::text)>300000 then raise exception 'Page too large' using errcode='22023';end if;
 if exists(select 1 from jsonb_each(p_input) where key in ('slug','title','description','address','phone','email','logo_data','accent','privacy_notice') and jsonb_typeof(value)<>'string') or exists(select 1 from jsonb_each(p_input) where key in ('published','booking_enabled') and jsonb_typeof(value)<>'boolean') or exists(select 1 from jsonb_each(p_input) where key in ('version','lead_minutes','window_days') and (jsonb_typeof(value)<>'number' or value::text!~'^[0-9]+$')) or jsonb_typeof(p_input->'service_ids')<>'array' or jsonb_typeof(p_input->'professional_ids')<>'array' then raise exception 'Invalid page fields' using errcode='22023';end if;
 if jsonb_array_length(p_input->'service_ids')>100 or jsonb_array_length(p_input->'professional_ids')>100 or exists(select 1 from jsonb_array_elements(p_input->'service_ids') x where jsonb_typeof(x)<>'string') or exists(select 1 from jsonb_array_elements(p_input->'professional_ids') x where jsonb_typeof(x)<>'string') then raise exception 'Invalid public selection' using errcode='22023';end if;
 if exists(select 1 from jsonb_array_elements_text(p_input->'service_ids') x where not exists(select 1 from public.services where tenant_id=p_tenant and id=x::uuid)) or exists(select 1 from jsonb_array_elements_text(p_input->'professional_ids') x where not exists(select 1 from public.professionals where tenant_id=p_tenant and id=x::uuid)) then raise exception 'Invalid public selection' using errcode='22023';end if;
 v_slug:=p_input->>'slug';v_published:=(p_input->>'published')::boolean;v_booking:=(p_input->>'booking_enabled')::boolean;
 select * into v_old from public.tenant_pages where tenant_id=p_tenant;
 if found and (v_old.version<>(p_input->>'version')::int or (v_old.slug_locked and v_old.slug<>v_slug)) then raise exception 'Page changed or address locked' using errcode='40001';end if;
 if v_booking then perform private.assert_entitlement(p_tenant,'online_booking');perform private.assert_entitlement(p_tenant,'appointments');perform private.assert_entitlement(p_tenant,'clients');end if;
 if v_published and v_booking and (jsonb_array_length(p_input->'service_ids')=0 or jsonb_array_length(p_input->'professional_ids')=0) then raise exception 'Select public services and professionals' using errcode='23514';end if;
 insert into public.tenant_pages(tenant_id,slug,title,description,address,phone,email,logo_data,accent,service_ids,professional_ids,privacy_notice,published,booking_enabled,slug_locked,lead_minutes,window_days,updated_by)
 values(p_tenant,v_slug,trim(p_input->>'title'),p_input->>'description',p_input->>'address',p_input->>'phone',lower(trim(p_input->>'email')),p_input->>'logo_data',p_input->>'accent',array(select x::uuid from jsonb_array_elements_text(p_input->'service_ids') x),array(select x::uuid from jsonb_array_elements_text(p_input->'professional_ids') x),p_input->>'privacy_notice',v_published,v_booking,v_published,(p_input->>'lead_minutes')::int,(p_input->>'window_days')::int,auth.uid())
 on conflict(tenant_id) do update set slug=excluded.slug,title=excluded.title,description=excluded.description,address=excluded.address,phone=excluded.phone,email=excluded.email,logo_data=excluded.logo_data,accent=excluded.accent,service_ids=excluded.service_ids,professional_ids=excluded.professional_ids,privacy_notice=excluded.privacy_notice,published=excluded.published,booking_enabled=excluded.booking_enabled,slug_locked=tenant_pages.slug_locked or excluded.slug_locked,lead_minutes=excluded.lead_minutes,window_days=excluded.window_days,version=tenant_pages.version+1,updated_by=auth.uid(),updated_at=now();
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),case when v_published then 'page.published' else 'page.saved-unpublished' end);
end;$$;
revoke all on function public.save_tenant_page(uuid,jsonb) from public,anon;grant execute on function public.save_tenant_page(uuid,jsonb) to authenticated;
create function private.visible_page(p_slug text) returns public.tenant_pages language plpgsql stable security definer set search_path='' as $$
declare p public.tenant_pages%rowtype;c jsonb;
begin
 select * into p from public.tenant_pages where slug=p_slug and published;
 if not found then return null;end if;c:=private.subscription_context(p.tenant_id);
 if not coalesce((c->>'writable')::boolean,false) or not coalesce((c->'plan_snapshot'->'features')?'public_page',false) then return null;end if;
 return p;
end;$$;
create function private.online_enabled(p public.tenant_pages) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(p.booking_enabled and (private.subscription_context(p.tenant_id)->'plan_snapshot'->'features') ?& array['online_booking','appointments','clients'],false);
$$;
revoke all on function private.visible_page(text),private.online_enabled(public.tenant_pages) from public,anon,authenticated;
create function public.public_clinic_page(p_slug text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.tenant_pages%rowtype;t public.tenants%rowtype;
begin
 p:=private.visible_page(p_slug);if p.tenant_id is null then return null;end if;
 select * into t from public.tenants where id=p.tenant_id;
 return jsonb_build_object('slug',p.slug,'title',p.title,'description',p.description,'address',p.address,'phone',p.phone,'email',p.email,'logo_data',p.logo_data,'accent',p.accent,'locale',t.locale,'currency',t.currency,'timezone',t.timezone,'privacy_notice',p.privacy_notice,'booking_enabled',private.online_enabled(p),'lead_minutes',p.lead_minutes,'window_days',p.window_days,
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'category',s.category,'duration_minutes',s.duration_minutes,'price_cents',s.price_cents) order by s.name) from public.services s where s.tenant_id=p.tenant_id and s.id=any(p.service_ids) and s.active),'[]'),
 'professionals',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'name',pr.name,'unit_name',u.name,'service_ids',array(select id from public.services where tenant_id=p.tenant_id and active and id=any(p.service_ids) and id=any(pr.service_ids))) order by pr.name) from public.professionals pr join public.units u on u.tenant_id=pr.tenant_id and u.id=pr.unit_id where pr.tenant_id=p.tenant_id and pr.id=any(p.professional_ids) and pr.active),'[]'));
end;$$;
create function public.public_clinic_slots(p_slug text,p_professional uuid,p_service uuid,p_date date) returns table(starts_at timestamptz) language plpgsql stable security definer set search_path='' as $$
declare p public.tenant_pages%rowtype;v_zone text;v_duration int;v_prep int;
begin
 p:=private.visible_page(p_slug);if p.tenant_id is null or not private.online_enabled(p) then return;end if;
 select timezone into v_zone from public.tenants where id=p.tenant_id;
 if p_date is null or p_date<(now() at time zone v_zone)::date or p_date>(now() at time zone v_zone)::date+p.window_days or not p_service=any(p.service_ids) or not p_professional=any(p.professional_ids) then return;end if;
 select s.duration_minutes,s.preparation_minutes into v_duration,v_prep from public.services s join public.professionals pr on pr.tenant_id=s.tenant_id and pr.id=p_professional and s.id=any(pr.service_ids) and pr.active where s.tenant_id=p.tenant_id and s.id=p_service and s.active;
 if v_duration is null then return;end if;
 return query select g from generate_series(p_date::timestamp at time zone v_zone,((p_date+1)::timestamp at time zone v_zone)-interval '15 minutes',interval '15 minutes') g where g>=now()+make_interval(mins=>p.lead_minutes) and private.slot_error(p.tenant_id,p_professional,g,v_duration,v_prep) is null;
end;$$;
revoke all on function public.public_clinic_page(text),public.public_clinic_slots(text,uuid,uuid,date) from public;grant execute on function public.public_clinic_page(text),public.public_clinic_slots(text,uuid,uuid,date) to anon,authenticated;
create function public.submit_online_booking(p_key text,p_slug text,p_request uuid,p_input jsonb,p_ip_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.tenant_pages%rowtype;v_hash bytea;v_contact bytea;v_existing private.online_requests%rowtype;v_prof public.professionals%rowtype;v_service public.services%rowtype;v_owner uuid;v_client uuid;v_appt uuid;v_reference uuid;v_start timestamptz;v_end timestamptz;v_zone text;v_currency text;v_receipt jsonb;v_name text;v_email text;v_phone text;
begin
 if p_key is null or length(p_key)<>64 or not exists(select 1 from private.booking_gateway_config where id=1 and key_hash=sha256(convert_to(p_key,'UTF8'))) then raise exception 'Gateway authorization required' using errcode='42501';end if;
 if p_request is null or p_ip_hash is null or p_ip_hash!~'^[a-f0-9]{64}$' then raise exception 'Invalid gateway request' using errcode='22023';end if;
 perform private.validate_operation(p_input,'{"name":"string","email":"string","phone":"string","service_id":"string","professional_id":"string","starts_at":"string","consent":"boolean"}',array['name','email','phone','service_id','professional_id','starts_at','consent']);
 v_name:=trim(p_input->>'name');v_email:=lower(trim(p_input->>'email'));v_phone:=trim(p_input->>'phone');
 if length(v_name) not between 2 and 120 or length(v_email)>254 or v_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_phone)>40 or v_phone!~'^[0-9+() .-]*$' or length(regexp_replace(v_phone,'[^0-9]','','g')) not between 7 and 18 or (p_input->>'consent')::boolean is distinct from true or (p_input->>'starts_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then return jsonb_build_object('error','invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('online-ip:'||p_ip_hash,77));
 p:=private.visible_page(p_slug);if p.tenant_id is null then return jsonb_build_object('error','unavailable');end if;
 perform pg_advisory_xact_lock(hashtextextended(p.tenant_id::text,77));
 -- Re-read after the lock: a downgrade or unpublish may have completed while waiting.
 p:=private.visible_page(p_slug);if p.tenant_id is null or not private.online_enabled(p) then return jsonb_build_object('error','unavailable');end if;
 v_hash:=sha256(convert_to(p_input::text,'UTF8'));v_contact:=sha256(convert_to(p.tenant_id::text||':'||v_email||':'||regexp_replace(v_phone,'[^0-9]','','g'),'UTF8'));
 select * into v_existing from private.online_requests where tenant_id=p.tenant_id and request_id=p_request;
 if found then if v_existing.payload_hash=v_hash and v_existing.ip_hash=p_ip_hash then return v_existing.receipt;else return jsonb_build_object('error','request_reused');end if;end if;
 delete from private.online_attempts where created_at<now()-interval '48 hours';
 if (select count(*) from private.online_attempts where ip_hash=p_ip_hash and created_at>now()-interval '15 minutes')>=10 or (select count(*) from private.online_attempts where tenant_id=p.tenant_id and created_at>now()-interval '15 minutes')>=60 or (select count(*) from private.online_attempts where tenant_id=p.tenant_id and contact_hash=v_contact and created_at>now()-interval '24 hours')>=3 then return jsonb_build_object('error','rate_limited');end if;
 insert into private.online_attempts(tenant_id,ip_hash,contact_hash) values(p.tenant_id,p_ip_hash,v_contact);
 v_start:=(p_input->>'starts_at')::timestamptz;select timezone,currency into v_zone,v_currency from public.tenants where id=p.tenant_id;
 if not exists(select 1 from public.public_clinic_slots(p_slug,(p_input->>'professional_id')::uuid,(p_input->>'service_id')::uuid,(v_start at time zone v_zone)::date) s where s.starts_at=v_start) then return jsonb_build_object('error','slot_unavailable');end if;
 select * into v_service from public.services where tenant_id=p.tenant_id and id=(p_input->>'service_id')::uuid;
 select * into v_prof from public.professionals where tenant_id=p.tenant_id and id=(p_input->>'professional_id')::uuid;
 select user_id into v_owner from public.memberships where tenant_id=p.tenant_id and role='owner' and active order by user_id limit 1;
 if v_owner is null then return jsonb_build_object('error','unavailable');end if;
 insert into public.clients(tenant_id,name,email,phone,communication,notes) values(p.tenant_id,v_name,v_email,v_phone,'none','Cadastro de marcação online. Contato não verificado; não mesclado com cadastros existentes.') returning id into v_client;
 v_end:=v_start+make_interval(mins=>v_service.duration_minutes);
 insert into public.appointments(tenant_id,unit_id,client_id,professional_id,service_id,starts_at,ends_at,busy_until,service_name,professional_name,price_cents,currency,duration_minutes,preparation_minutes,created_by,booking_source)
 values(p.tenant_id,v_prof.unit_id,v_client,v_prof.id,v_service.id,v_start,v_end,v_end+make_interval(mins=>v_service.preparation_minutes),v_service.name,v_prof.name,v_service.price_cents,v_currency,v_service.duration_minutes,v_service.preparation_minutes,null,'online') returning id into v_appt;
 insert into public.appointment_events(tenant_id,appointment_id,actor_id,actor_kind,action,reason,starts_at,status) values(p.tenant_id,v_appt,null,'public','create','Origem: marcação pública, sem autenticação do cliente.',v_start,'scheduled');
 insert into public.online_bookings(tenant_id,appointment_id,privacy_snapshot) values(p.tenant_id,v_appt,p.privacy_notice) returning id into v_reference;
 insert into public.audit_events(tenant_id,actor_id,action) values(p.tenant_id,null,'appointment.online-created');
 v_receipt:=jsonb_build_object('reference',v_reference,'starts_at',v_start,'ends_at',v_end,'service',v_service.name,'professional',v_prof.name,'unit_name',(select name from public.units where tenant_id=p.tenant_id and id=v_prof.unit_id),'price_cents',v_service.price_cents,'currency',v_currency,'timezone',v_zone,'status','scheduled');
 insert into private.online_requests(tenant_id,request_id,payload_hash,ip_hash,receipt) values(p.tenant_id,p_request,v_hash,p_ip_hash,v_receipt);return v_receipt;
end;$$;
revoke all on function public.submit_online_booking(text,text,uuid,jsonb,text) from public;grant execute on function public.submit_online_booking(text,text,uuid,jsonb,text) to anon,authenticated;
-- Export retains compatibility and includes site configuration and online consent history.
alter function public.export_tenant_operations(uuid) set schema private;
alter function private.export_tenant_operations(uuid) rename to export_business_base;
revoke all on function private.export_business_base(uuid) from public,anon,authenticated;
create function public.export_tenant_operations(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 return private.export_business_base(p_tenant)||jsonb_build_object('tenant_page',(select to_jsonb(p) from public.tenant_pages p where tenant_id=p_tenant),'online_bookings',coalesce((select jsonb_agg(to_jsonb(b)) from public.online_bookings b where tenant_id=p_tenant),'[]'));
end;$$;
revoke all on function public.export_tenant_operations(uuid) from public,anon;grant execute on function public.export_tenant_operations(uuid) to authenticated;
commit;
