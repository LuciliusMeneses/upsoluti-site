begin;
create table public.physical_resources(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),unit_id uuid not null,
 name text not null check(length(trim(name)) between 2 and 100),kind text not null check(kind in ('room','cabin','equipment')),
 cleanup_minutes int not null default 0 check(cleanup_minutes between 0 and 120),active boolean not null default true,version int not null default 1,
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),unique(tenant_id,id)
);
create table public.service_resource_sets(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),unit_id uuid not null,service_id uuid not null,
 resource_ids uuid[] not null default '{}',version int not null default 1,
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),foreign key(tenant_id,service_id) references public.services(tenant_id,id),unique(tenant_id,unit_id,service_id)
);
create table public.resource_blocks(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),resource_id uuid not null,
 starts_at timestamptz not null,ends_at timestamptz not null,reason text not null check(length(trim(reason)) between 2 and 300),active boolean not null default true,version int not null default 1,
 foreign key(tenant_id,resource_id) references public.physical_resources(tenant_id,id),check(ends_at>starts_at and ends_at<=starts_at+interval '366 days')
);
alter table public.appointments add column resource_snapshot jsonb not null default '[]' check(jsonb_typeof(resource_snapshot)='array');
create table public.appointment_resources(
 tenant_id uuid not null,appointment_id uuid not null,resource_id uuid not null,resource_name text not null,kind text not null,cleanup_minutes int not null,
 starts_at timestamptz not null,busy_until timestamptz not null,primary key(tenant_id,appointment_id,resource_id),
 foreign key(tenant_id,appointment_id) references public.appointments(tenant_id,id),foreign key(tenant_id,resource_id) references public.physical_resources(tenant_id,id),check(busy_until>starts_at)
);
create index appointment_resources_overlap on public.appointment_resources(tenant_id,resource_id,starts_at,busy_until);
create index resource_blocks_overlap on public.resource_blocks(tenant_id,resource_id,starts_at,ends_at) where active;
create table private.resource_requests(tenant_id uuid not null references public.tenants(id),request_id uuid not null,actor_id uuid not null references auth.users(id),payload jsonb not null,result_id uuid not null,primary key(tenant_id,request_id));
create table public.resource_events(id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id),actor_id uuid not null references auth.users(id),action text not null,details jsonb not null,created_at timestamptz not null default now());
revoke all on private.resource_requests from public,anon,authenticated;
alter table public.physical_resources enable row level security;
alter table public.service_resource_sets enable row level security;
alter table public.resource_blocks enable row level security;
alter table public.appointment_resources enable row level security;
alter table public.resource_events enable row level security;
revoke all on public.physical_resources,public.service_resource_sets,public.resource_blocks,public.appointment_resources,public.resource_events from anon,authenticated;
grant select on public.physical_resources,public.service_resource_sets,public.resource_blocks,public.appointment_resources,public.resource_events to authenticated;
create policy physical_resources_read on public.physical_resources for select to authenticated using(private.can_operate(tenant_id));
create policy service_resource_sets_read on public.service_resource_sets for select to authenticated using(private.can_operate(tenant_id));
create policy resource_blocks_read on public.resource_blocks for select to authenticated using(private.can_operate(tenant_id));
create policy appointment_resources_read on public.appointment_resources for select to authenticated using(exists(select 1 from public.appointments a where a.tenant_id=appointment_resources.tenant_id and a.id=appointment_resources.appointment_id));
create policy resource_events_read on public.resource_events for select to authenticated using(private.has_role(tenant_id,array['owner','manager']::public.member_role[]));

create function private.resource_snapshot(p_tenant uuid,p_unit uuid,p_service uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('resource_id',r.id,'name',r.name,'kind',r.kind,'cleanup_minutes',r.cleanup_minutes) order by r.id),'[]')
 from public.service_resource_sets s cross join lateral unnest(s.resource_ids) i
 join public.physical_resources r on r.tenant_id=s.tenant_id and r.id=i
 where s.tenant_id=p_tenant and s.unit_id=p_unit and s.service_id=p_service;
$$;
create function private.resource_slot_error(p_tenant uuid,p_prof uuid,p_service uuid,p_start timestamptz,p_duration int,p_prep int,p_ignore uuid default null) returns text
language plpgsql stable security definer set search_path='' as $$
declare unit uuid;zone text;snapshot jsonb;r record;until_at timestamptz;local_start timestamp;local_end timestamp;
begin
 select p.unit_id,t.timezone into unit,zone from public.professionals p join public.tenants t on t.id=p.tenant_id where p.tenant_id=p_tenant and p.id=p_prof;
 if unit is null then return 'Invalid resource unit';end if;
 if p_ignore is null then snapshot:=private.resource_snapshot(p_tenant,unit,p_service);
 else select resource_snapshot into snapshot from public.appointments where tenant_id=p_tenant and id=p_ignore;end if;
 for r in select x.*,pr.active,pr.unit_id from jsonb_to_recordset(coalesce(snapshot,'[]')) as x(resource_id uuid,name text,kind text,cleanup_minutes int) left join public.physical_resources pr on pr.tenant_id=p_tenant and pr.id=x.resource_id loop
  if r.active is distinct from true or r.unit_id is distinct from unit then return 'Resource unavailable';end if;
  until_at:=p_start+make_interval(mins=>p_duration+greatest(p_prep,r.cleanup_minutes));local_start:=p_start at time zone zone;local_end:=until_at at time zone zone;
  if local_start::date<>local_end::date or (p_start at time zone zone)-(p_start at time zone 'UTC') is distinct from (until_at at time zone zone)-(until_at at time zone 'UTC') then return 'Resource clock or date limit';end if;
  if not exists(select 1 from public.working_hours h where h.tenant_id=p_tenant and h.unit_id=unit and h.professional_id is null and h.weekday=extract(dow from local_start)::int and h.start_time<=local_start::time and h.end_time>=local_end::time) then return 'Resource cleanup outside unit hours';end if;
  if exists(select 1 from public.schedule_blocks b where b.tenant_id=p_tenant and b.unit_id=unit and b.professional_id is null and b.starts_at<until_at and b.ends_at>p_start) then return 'Resource unit blocked during cleanup';end if;
  if exists(select 1 from public.resource_blocks b where b.tenant_id=p_tenant and b.resource_id=r.resource_id and b.active and b.starts_at<until_at and b.ends_at>p_start) then return 'Resource maintenance or cleaning block';end if;
  if exists(select 1 from public.appointment_resources ar join public.appointments a on a.tenant_id=ar.tenant_id and a.id=ar.appointment_id where ar.tenant_id=p_tenant and ar.resource_id=r.resource_id and a.status<>'cancelled' and a.id is distinct from p_ignore and ar.starts_at<until_at and ar.busy_until>p_start) then return 'Resource reservation conflict';end if;
 end loop;
 return null;
end;$$;
revoke all on function private.resource_snapshot(uuid,uuid,uuid),private.resource_slot_error(uuid,uuid,uuid,timestamptz,int,int,uuid) from public,anon,authenticated;

create function private.guard_appointment_resources() returns trigger language plpgsql security definer set search_path='' as $$
declare problem text;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.tenant_id::text,77));
 if tg_op='INSERT' then new.resource_snapshot:=private.resource_snapshot(new.tenant_id,new.unit_id,new.service_id);
 else new.resource_snapshot:=old.resource_snapshot;end if;
 if new.status<>'cancelled' and (tg_op='INSERT' or new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at or new.preparation_minutes is distinct from old.preparation_minutes or old.status='cancelled') then
  problem:=private.resource_slot_error(new.tenant_id,new.professional_id,new.service_id,new.starts_at,new.duration_minutes,new.preparation_minutes,case when tg_op='INSERT' then null else new.id end);
  if problem is not null then raise exception '%',problem using errcode='23P01';end if;
 end if;
 return new;
end;$$;
create function private.sync_appointment_resources() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.appointment_resources(tenant_id,appointment_id,resource_id,resource_name,kind,cleanup_minutes,starts_at,busy_until)
 select new.tenant_id,new.id,x.resource_id,x.name,x.kind,x.cleanup_minutes,new.starts_at,new.ends_at+make_interval(mins=>greatest(new.preparation_minutes,x.cleanup_minutes))
 from jsonb_to_recordset(new.resource_snapshot) as x(resource_id uuid,name text,kind text,cleanup_minutes int)
 on conflict(tenant_id,appointment_id,resource_id) do update set starts_at=excluded.starts_at,busy_until=excluded.busy_until;
 return new;
end;$$;
revoke all on function private.guard_appointment_resources(),private.sync_appointment_resources() from public,anon,authenticated;
create trigger appointment_resources_guard before insert or update on public.appointments for each row execute function private.guard_appointment_resources();
create trigger appointment_resources_sync after insert or update of starts_at,ends_at,preparation_minutes on public.appointments for each row execute function private.sync_appointment_resources();

create function public.manage_resource(p_tenant uuid,p_request uuid,p_input jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare previous private.resource_requests%rowtype;kind text;result uuid;old_resource public.physical_resources%rowtype;old_set public.service_resource_sets%rowtype;old_block public.resource_blocks%rowtype;ids uuid[];unit uuid;service uuid;start_at timestamptz;end_at timestamptz;before_data jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if not private.has_role(p_tenant,array['owner','manager']::public.member_role[]) then raise exception 'Resource management required' using errcode='42501';end if;
 if p_request is null then raise exception 'Request required' using errcode='22023';end if;
 select * into previous from private.resource_requests where tenant_id=p_tenant and request_id=p_request;
 if found then if previous.actor_id<>auth.uid() or previous.payload<>p_input then raise exception 'Resource request changed' using errcode='PT409';end if;return previous.result_id;end if;
 perform private.assert_entitlement(p_tenant,'appointments');
 kind:=p_input->>'action';
 if kind='resource' then
  perform private.validate_operation(p_input,'{"action":"string","id":"string","version":"number","unit_id":"string","name":"string","kind":"string","cleanup_minutes":"number","active":"boolean"}',array['action','unit_id','name','kind','cleanup_minutes','active']);
  if p_input ? 'id' then
   select * into old_resource from public.physical_resources where tenant_id=p_tenant and id=(p_input->>'id')::uuid;
   if not found or old_resource.version is distinct from (p_input->>'version')::int then raise exception 'Resource changed' using errcode='PT409';end if;
   if old_resource.unit_id<>(p_input->>'unit_id')::uuid then raise exception 'Resource unit cannot change' using errcode='22023';end if;
   if not (p_input->>'active')::boolean and exists(select 1 from public.appointment_resources ar join public.appointments a on a.tenant_id=ar.tenant_id and a.id=ar.appointment_id where ar.tenant_id=p_tenant and ar.resource_id=old_resource.id and a.status<>'cancelled' and ar.busy_until>now()) then raise exception 'Future reservations prevent resource deactivation' using errcode='23P01';end if;
   before_data:=to_jsonb(old_resource);result:=old_resource.id;
   update public.physical_resources set name=trim(p_input->>'name'),kind=p_input->>'kind',cleanup_minutes=(p_input->>'cleanup_minutes')::int,active=(p_input->>'active')::boolean,version=version+1 where tenant_id=p_tenant and id=result;
  else
   insert into public.physical_resources(tenant_id,unit_id,name,kind,cleanup_minutes,active) values(p_tenant,(p_input->>'unit_id')::uuid,trim(p_input->>'name'),p_input->>'kind',(p_input->>'cleanup_minutes')::int,(p_input->>'active')::boolean) returning id into result;
  end if;
 elsif kind='requirements' then
  perform private.validate_operation(p_input,'{"action":"string","unit_id":"string","service_id":"string","resource_ids":"array","version":"number"}',array['action','unit_id','service_id','resource_ids','version']);
  unit:=(p_input->>'unit_id')::uuid;service:=(p_input->>'service_id')::uuid;
  if jsonb_array_length(p_input->'resource_ids')>100 or exists(select 1 from jsonb_array_elements(p_input->'resource_ids') x where jsonb_typeof(x)<>'string') then raise exception 'Invalid resource selection' using errcode='22023';end if;
  ids:=array(select distinct x::uuid from jsonb_array_elements_text(p_input->'resource_ids') x order by x::uuid);
  if exists(select 1 from unnest(ids) i where not exists(select 1 from public.physical_resources r where r.tenant_id=p_tenant and r.unit_id=unit and r.id=i and r.active)) then raise exception 'Invalid resource selection' using errcode='22023';end if;
  select * into old_set from public.service_resource_sets where tenant_id=p_tenant and unit_id=unit and service_id=service;
  if coalesce(old_set.version,0)<>(p_input->>'version')::int then raise exception 'Resource requirements changed' using errcode='PT409';end if;
  if coalesce(old_set.resource_ids,'{}') is distinct from ids and exists(select 1 from public.appointments a where a.tenant_id=p_tenant and a.unit_id=unit and a.service_id=service and a.status<>'cancelled' and a.busy_until>now()) then raise exception 'Future appointments prevent resource requirements change' using errcode='23P01';end if;
  before_data:=to_jsonb(old_set);
  insert into public.service_resource_sets(tenant_id,unit_id,service_id,resource_ids) values(p_tenant,unit,service,ids)
  on conflict(tenant_id,unit_id,service_id) do update set resource_ids=excluded.resource_ids,version=service_resource_sets.version+1 returning id into result;
 elsif kind='block' then
  perform private.validate_operation(p_input,'{"action":"string","id":"string","version":"number","resource_id":"string","starts_at":"string","ends_at":"string","reason":"string","active":"boolean"}',array['action','resource_id','starts_at','ends_at','reason','active']);
  if (p_input->>'starts_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' or (p_input->>'ends_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Explicit block offset required' using errcode='22023';end if;
  start_at:=(p_input->>'starts_at')::timestamptz;end_at:=(p_input->>'ends_at')::timestamptz;
  if (p_input->>'active')::boolean and exists(select 1 from public.appointment_resources ar join public.appointments a on a.tenant_id=ar.tenant_id and a.id=ar.appointment_id where ar.tenant_id=p_tenant and ar.resource_id=(p_input->>'resource_id')::uuid and a.status<>'cancelled' and ar.starts_at<end_at and ar.busy_until>start_at) then raise exception 'Resource block overlaps reservation' using errcode='23P01';end if;
  if p_input ? 'id' then
   select * into old_block from public.resource_blocks where tenant_id=p_tenant and id=(p_input->>'id')::uuid;
   if not found or old_block.version is distinct from (p_input->>'version')::int then raise exception 'Resource block changed' using errcode='PT409';end if;
   before_data:=to_jsonb(old_block);result:=old_block.id;
   update public.resource_blocks set resource_id=(p_input->>'resource_id')::uuid,starts_at=start_at,ends_at=end_at,reason=trim(p_input->>'reason'),active=(p_input->>'active')::boolean,version=version+1 where tenant_id=p_tenant and id=result;
  else
   insert into public.resource_blocks(tenant_id,resource_id,starts_at,ends_at,reason,active) values(p_tenant,(p_input->>'resource_id')::uuid,start_at,end_at,trim(p_input->>'reason'),(p_input->>'active')::boolean) returning id into result;
  end if;
 else raise exception 'Invalid resource action' using errcode='22023';end if;
 insert into public.resource_events(tenant_id,actor_id,action,details) values(p_tenant,auth.uid(),kind,jsonb_build_object('id',result,'before',before_data,'input',p_input));
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'resources.'||kind||'.saved');
 insert into private.resource_requests values(p_tenant,p_request,auth.uid(),p_input,result);
 return result;
end;$$;
revoke all on function public.manage_resource(uuid,uuid,jsonb) from public,anon;
grant execute on function public.manage_resource(uuid,uuid,jsonb) to authenticated;

create function public.resource_data(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.can_operate(p_tenant) then raise exception 'Resource access required' using errcode='42501';end if;
 return jsonb_build_object(
 'resources',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.physical_resources where tenant_id=p_tenant order by name,id limit 1001)x),'[]'),
 'requirements',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.service_resource_sets where tenant_id=p_tenant order by id limit 1001)x),'[]'),
 'blocks',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.resource_blocks where tenant_id=p_tenant order by starts_at desc,id limit 1001)x),'[]'));
end;$$;
revoke all on function public.resource_data(uuid) from public,anon;grant execute on function public.resource_data(uuid) to authenticated;

-- Preserve the previous export contract and owner-only authorization.
alter function public.export_tenant_operations(uuid) set schema private;
alter function private.export_tenant_operations(uuid) rename to export_public_page_base;
revoke all on function private.export_public_page_base(uuid) from public,anon,authenticated;
create function public.export_tenant_operations(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare data jsonb;tab text;items jsonb;
begin
 data:=private.export_public_page_base(p_tenant);
 foreach tab in array array['physical_resources','service_resource_sets','resource_blocks','appointment_resources','resource_events'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from public.%I x where tenant_id=$1',tab) into items using p_tenant;data:=data||jsonb_build_object(tab,items);
 end loop;return data;
end;$$;
revoke all on function public.export_tenant_operations(uuid) from public,anon;grant execute on function public.export_tenant_operations(uuid) to authenticated;
create or replace function public.available_appointment_slots(p_tenant uuid,p_professional uuid,p_service uuid,p_date date,p_appointment uuid default null)
returns table(starts_at timestamptz) language plpgsql stable security definer set search_path='' as $$
declare v_zone text;v_duration int;v_prep int;v_row public.appointments%rowtype;
begin
 if not private.can_operate(p_tenant) then raise exception 'Forbidden' using errcode='42501';end if;
 select timezone into v_zone from public.tenants where id=p_tenant;
 if p_date is null or p_date<(now() at time zone v_zone)::date or p_date>(now() at time zone v_zone)::date+366 then raise exception 'Date outside booking window' using errcode='22023';end if;
 select s.duration_minutes,s.preparation_minutes into v_duration,v_prep from public.services s join public.professionals p on p.tenant_id=s.tenant_id and p_service=any(p.service_ids) where s.tenant_id=p_tenant and s.id=p_service and s.active and p.id=p_professional and p.active;
 if v_duration is null then return;end if;
 if p_appointment is not null then
  select * into v_row from public.appointments where tenant_id=p_tenant and id=p_appointment and status<>'cancelled';
  if not found or v_row.service_id<>p_service or v_row.professional_id<>p_professional then raise exception 'Invalid appointment' using errcode='22023';end if;
  v_duration:=v_row.duration_minutes;v_prep:=v_row.preparation_minutes;
 end if;
 return query select g from generate_series(p_date::timestamp at time zone v_zone,(p_date+1)::timestamp at time zone v_zone - interval '15 minutes',interval '15 minutes') g where g>now() and private.slot_error(p_tenant,p_professional,g,v_duration,v_prep,p_appointment) is null and private.resource_slot_error(p_tenant,p_professional,p_service,g,v_duration,v_prep,p_appointment) is null;
end;
$$;
create or replace function public.public_clinic_slots(p_slug text,p_professional uuid,p_service uuid,p_date date) returns table(starts_at timestamptz) language plpgsql stable security definer set search_path='' as $$
declare p public.tenant_pages%rowtype;v_zone text;v_duration int;v_prep int;
begin
 p:=private.visible_page(p_slug);if p.tenant_id is null or not private.online_enabled(p) then return;end if;
 select timezone into v_zone from public.tenants where id=p.tenant_id;
 if p_date is null or p_date<(now() at time zone v_zone)::date or p_date>(now() at time zone v_zone)::date+p.window_days or not p_service=any(p.service_ids) or not p_professional=any(p.professional_ids) then return;end if;
 select s.duration_minutes,s.preparation_minutes into v_duration,v_prep from public.services s join public.professionals pr on pr.tenant_id=s.tenant_id and pr.id=p_professional and s.id=any(pr.service_ids) and pr.active where s.tenant_id=p.tenant_id and s.id=p_service and s.active;
 if v_duration is null then return;end if;
 return query select g from generate_series(p_date::timestamp at time zone v_zone,((p_date+1)::timestamp at time zone v_zone)-interval '15 minutes',interval '15 minutes') g where g>=now()+make_interval(mins=>p.lead_minutes) and private.slot_error(p.tenant_id,p_professional,g,v_duration,v_prep) is null and private.resource_slot_error(p.tenant_id,p_professional,p_service,g,v_duration,v_prep) is null;
end;$$;
-- Preserve internal retry receipts while avoiding serialization retries for stale versions.
create or replace function private.mutate_appointment_core(p_tenant uuid,p_request uuid,p_input jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_previous private.operation_requests%rowtype;v_appointment public.appointments%rowtype;v_service public.services%rowtype;v_prof public.professionals%rowtype;
 v_id uuid;v_action text;v_start timestamptz;v_error text;v_currency text;v_status text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if not private.can_operate(p_tenant) then raise exception 'Forbidden' using errcode='42501';end if;
 perform private.assert_entitlement(p_tenant,'appointments');
 if p_input ? 'starts_at' and (p_input->>'starts_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Explicit time offset required' using errcode='22023';end if;
 if p_input ? 'reason' and length(p_input->>'reason')>300 then raise exception 'Reason too long' using errcode='22023';end if;
 if p_request is null then raise exception 'Request key required' using errcode='22023';end if;
 perform private.validate_operation(p_input,'{"action":"string","id":"string","version":"number","professional_id":"string","service_id":"string","client_id":"string","starts_at":"string","reason":"string"}',array['action']);
 select * into v_previous from private.operation_requests where tenant_id=p_tenant and request_id=p_request;
 if found then
  if v_previous.actor_id<>auth.uid() or v_previous.payload<>p_input then raise exception 'Request key reused with different data' using errcode='22023';end if;
  return v_previous.result_id;
 end if;
 v_action:=p_input->>'action';
 if v_action='create' then
  if not p_input ?& array['professional_id','service_id','client_id','starts_at'] then raise exception 'Missing appointment fields' using errcode='22023';end if;
  select * into v_prof from public.professionals where tenant_id=p_tenant and id=(p_input->>'professional_id')::uuid and active;
  select * into v_service from public.services where tenant_id=p_tenant and id=(p_input->>'service_id')::uuid and active;
  if v_prof.id is null or v_service.id is null or not v_service.id=any(v_prof.service_ids) or not exists(select 1 from public.clients where tenant_id=p_tenant and id=(p_input->>'client_id')::uuid and active) then raise exception 'Invalid client, service or professional' using errcode='22023';end if;
  v_start:=(p_input->>'starts_at')::timestamptz;
  if v_start<=now() or v_start>now()+interval '367 days' then raise exception 'Invalid booking date' using errcode='22023';end if;
  v_error:=private.slot_error(p_tenant,v_prof.id,v_start,v_service.duration_minutes,v_service.preparation_minutes);
  if v_error is not null then raise exception '%',v_error using errcode='23P01';end if;
  select currency into v_currency from public.tenants where id=p_tenant;
  insert into public.appointments(tenant_id,unit_id,client_id,professional_id,service_id,starts_at,ends_at,busy_until,service_name,professional_name,price_cents,currency,duration_minutes,preparation_minutes,created_by)
  values(p_tenant,v_prof.unit_id,(p_input->>'client_id')::uuid,v_prof.id,v_service.id,v_start,v_start+make_interval(mins=>v_service.duration_minutes),v_start+make_interval(mins=>v_service.duration_minutes+v_service.preparation_minutes),v_service.name,v_prof.name,v_service.price_cents,v_currency,v_service.duration_minutes,v_service.preparation_minutes,auth.uid()) returning id into v_id;
  v_status:='scheduled';
 elsif v_action in ('reschedule','cancel','confirm') then
  if not p_input ?& array['id','version'] then raise exception 'Missing version' using errcode='22023';end if;
  select * into v_appointment from public.appointments where tenant_id=p_tenant and id=(p_input->>'id')::uuid for update;
  if not found then raise exception 'Appointment unavailable' using errcode='42501';end if;
  if v_appointment.version<>(p_input->>'version')::int then raise exception 'Appointment changed; reload' using errcode='PT409';end if;
  if v_appointment.status='cancelled' then raise exception 'Appointment already cancelled' using errcode='22023';end if;
  v_id:=v_appointment.id;v_start:=v_appointment.starts_at;v_status:=v_appointment.status;
  if v_action='reschedule' then
   if not p_input ?& array['starts_at','reason'] or length(trim(p_input->>'reason')) not between 2 and 300 then raise exception 'Reschedule reason required' using errcode='22023';end if;
   v_start:=(p_input->>'starts_at')::timestamptz;
   if v_start<=now() or v_start>now()+interval '367 days' then raise exception 'Invalid booking date' using errcode='22023';end if;
   if not exists(select 1 from public.professionals where tenant_id=p_tenant and id=v_appointment.professional_id and active and v_appointment.service_id=any(service_ids)) or not exists(select 1 from public.services where tenant_id=p_tenant and id=v_appointment.service_id and active) then raise exception 'Inactive or unqualified professional/service' using errcode='22023';end if;
   v_error:=private.slot_error(p_tenant,v_appointment.professional_id,v_start,v_appointment.duration_minutes,v_appointment.preparation_minutes,v_id);
   if v_error is not null then raise exception '%',v_error using errcode='23P01';end if;
   update public.appointments set starts_at=v_start,ends_at=v_start+make_interval(mins=>v_appointment.duration_minutes),busy_until=v_start+make_interval(mins=>v_appointment.duration_minutes+v_appointment.preparation_minutes),version=version+1,updated_at=now() where id=v_id and tenant_id=p_tenant;
  else
   if v_action='cancel' and (not p_input ? 'reason' or length(trim(p_input->>'reason')) not between 2 and 300) then raise exception 'Cancellation reason required' using errcode='22023';end if;
   if v_action='confirm' and v_appointment.status<>'scheduled' then raise exception 'Invalid transition' using errcode='22023';end if;
   v_status:=case when v_action='cancel' then 'cancelled' else 'confirmed' end;
   update public.appointments set status=v_status,version=version+1,updated_at=now() where id=v_id and tenant_id=p_tenant;
  end if;
 else raise exception 'Invalid action' using errcode='22023';end if;
 insert into public.appointment_events(tenant_id,appointment_id,actor_id,action,reason,starts_at,status) values(p_tenant,v_id,auth.uid(),v_action,coalesce(p_input->>'reason',''),v_start,v_status);
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'appointment.'||v_action);
 insert into private.operation_requests(tenant_id,request_id,actor_id,payload,result_id) values(p_tenant,p_request,auth.uid(),p_input,v_id);
 return v_id;
end;
$$;
revoke all on function private.mutate_appointment_core(uuid,uuid,jsonb) from public,anon,authenticated;
commit;