begin;
create table public.services (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 name text not null check(length(trim(name)) between 2 and 100), category text not null default '' check(length(category)<=80),
 duration_minutes int not null check(duration_minutes between 5 and 480), preparation_minutes int not null default 0 check(preparation_minutes between 0 and 120),
 price_cents int not null check(price_cents between 0 and 100000000), active boolean not null default true, version int not null default 1,
 unique(tenant_id,id)
);
create table public.professionals (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),unit_id uuid not null,
 name text not null check(length(trim(name)) between 2 and 100), service_ids uuid[] not null default '{}',
 user_id uuid references auth.users(id), active boolean not null default true,version int not null default 1,
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),unique(tenant_id,id),unique(tenant_id,user_id)
);
create table public.clients (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 name text not null check(length(trim(name)) between 2 and 120),email text not null default '' check(length(email)<=254 and (email='' or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 phone text not null default '' check(length(phone)<=40),communication text not null default 'none' check(communication in ('none','email','phone')),
 notes text not null default '' check(length(notes)<=1000),active boolean not null default true,version int not null default 1,
 created_at timestamptz not null default now(),unique(tenant_id,id)
);
create table public.working_hours (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),unit_id uuid not null,professional_id uuid,
 weekday int not null check(weekday between 0 and 6),start_time time not null,end_time time not null,
 version int not null default 1,check(end_time>start_time),
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),foreign key(tenant_id,professional_id) references public.professionals(tenant_id,id),
 unique nulls not distinct(tenant_id,unit_id,professional_id,weekday,start_time)
);
create table public.schedule_blocks (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),unit_id uuid not null,professional_id uuid,
 starts_at timestamptz not null,ends_at timestamptz not null,reason text not null check(length(trim(reason)) between 2 and 300),version int not null default 1,
 check(ends_at>starts_at and ends_at<=starts_at+interval '366 days'),
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),foreign key(tenant_id,professional_id) references public.professionals(tenant_id,id)
);
create table public.appointments (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),unit_id uuid not null,
 client_id uuid not null,professional_id uuid not null,service_id uuid not null,
 starts_at timestamptz not null,ends_at timestamptz not null,busy_until timestamptz not null,
 service_name text not null,professional_name text not null,price_cents int not null,currency text not null,
 duration_minutes int not null,preparation_minutes int not null,
 status text not null default 'scheduled' check(status in ('scheduled','confirmed','cancelled')),
 version int not null default 1,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(tenant_id,unit_id) references public.units(tenant_id,id),foreign key(tenant_id,client_id) references public.clients(tenant_id,id),
 foreign key(tenant_id,professional_id) references public.professionals(tenant_id,id),foreign key(tenant_id,service_id) references public.services(tenant_id,id),
 unique(tenant_id,id),check(ends_at>starts_at and busy_until>=ends_at)
);
create index appointments_calendar on public.appointments(tenant_id,starts_at);
create index appointments_professional on public.appointments(tenant_id,professional_id,starts_at,busy_until) where status<>'cancelled';
create index clients_lookup on public.clients(tenant_id,lower(name));
create table public.appointment_events (
 id bigint generated always as identity primary key,tenant_id uuid not null,appointment_id uuid not null,
 actor_id uuid not null references auth.users(id),action text not null,reason text not null default '',
 starts_at timestamptz not null,status text not null,created_at timestamptz not null default now(),
 foreign key(tenant_id,appointment_id) references public.appointments(tenant_id,id)
);
create table private.operation_requests (
 tenant_id uuid not null references public.tenants(id),request_id uuid not null,actor_id uuid not null references auth.users(id),
 payload jsonb not null,result_id uuid not null,primary key(tenant_id,request_id)
);
revoke all on private.operation_requests from public,anon,authenticated;

create function private.can_operate(p_tenant uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(p_tenant,array['owner','manager','reception']::public.member_role[]);
$$;
create function private.can_view_professional(p_tenant uuid,p_prof uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_operate(p_tenant) or (private.has_role(p_tenant,array['professional']::public.member_role[]) and exists(select 1 from public.professionals where tenant_id=p_tenant and id=p_prof and user_id=auth.uid() and active));
$$;
create function private.can_view_client(p_tenant uuid,p_client uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_operate(p_tenant) or exists(select 1 from public.appointments where tenant_id=p_tenant and client_id=p_client and private.can_view_professional(p_tenant,professional_id));
$$;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.clients enable row level security;
alter table public.working_hours enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
create policy services_read on public.services for select to authenticated using(private.has_role(tenant_id,array['owner','manager','reception','professional']::public.member_role[]));
create policy professionals_read on public.professionals for select to authenticated using(private.can_view_professional(tenant_id,id));
create policy clients_read on public.clients for select to authenticated using(private.can_view_client(tenant_id,id));
create policy hours_read on public.working_hours for select to authenticated using(private.can_operate(tenant_id) or (professional_id is null and private.has_role(tenant_id,array['professional']::public.member_role[])) or private.can_view_professional(tenant_id,professional_id));
create policy blocks_read on public.schedule_blocks for select to authenticated using(private.can_operate(tenant_id) or private.can_view_professional(tenant_id,professional_id));
create policy appointments_read on public.appointments for select to authenticated using(private.can_view_professional(tenant_id,professional_id));
create policy events_read on public.appointment_events for select to authenticated using(exists(select 1 from public.appointments a where a.tenant_id=appointment_events.tenant_id and a.id=appointment_events.appointment_id));
revoke all on public.services,public.professionals,public.clients,public.working_hours,public.schedule_blocks,public.appointments,public.appointment_events from anon,authenticated;
grant select on public.services,public.professionals,public.clients,public.working_hours,public.schedule_blocks,public.appointments,public.appointment_events to authenticated;
revoke all on function private.can_operate(uuid),private.can_view_professional(uuid,uuid),private.can_view_client(uuid,uuid) from public;
grant execute on function private.can_operate(uuid),private.can_view_professional(uuid,uuid),private.can_view_client(uuid,uuid) to authenticated;

create function private.validate_operation(p_input jsonb,p_types jsonb,p_required text[]) returns void language plpgsql set search_path='' as $$
declare field text;kind text;actual text;
begin
 if jsonb_typeof(p_input) is distinct from 'object' then raise exception 'Invalid fields' using errcode='22023';end if;
 if octet_length(p_input::text)>16000 or not p_input ?& p_required or exists(select 1 from jsonb_object_keys(p_input) k where not p_types ? k) then raise exception 'Invalid fields' using errcode='22023';end if;
 for field,kind in select * from jsonb_each_text(p_types) loop
  if p_input ? field then
   actual:=jsonb_typeof(p_input->field);
   if kind='number' and (p_input->>field)!~'^[0-9]+$' then raise exception 'Integer value required' using errcode='22023';end if;
   if not (actual=rtrim(kind,'?') or (right(kind,1)='?' and actual='null')) then raise exception 'Invalid field type: %',field using errcode='22023';end if;
  end if;
 end loop;
end;
$$;
create function public.save_operation_record(p_tenant uuid,p_kind text,p_input jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_version int;v_count int;v_unit uuid;v_prof uuid;v_delete boolean;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if p_kind='client' then
  if not private.can_operate(p_tenant) then raise exception 'Forbidden' using errcode='42501';end if;
 else
  if not private.has_role(p_tenant,array['owner','manager']::public.member_role[]) then raise exception 'Forbidden' using errcode='42501';end if;
 end if;
 case p_kind
 when 'service' then
  perform private.validate_operation(p_input,'{"id":"string?","version":"number","name":"string","category":"string","duration_minutes":"number","preparation_minutes":"number","price_cents":"number","active":"boolean"}',array['name','duration_minutes','preparation_minutes','price_cents','active']);
 when 'professional' then
  perform private.validate_operation(p_input,'{"id":"string?","version":"number","name":"string","unit_id":"string","service_ids":"array","user_id":"string?","active":"boolean"}',array['name','unit_id','service_ids','active']);
 when 'client' then
  perform private.validate_operation(p_input,'{"id":"string?","version":"number","name":"string","email":"string","phone":"string","communication":"string","notes":"string","active":"boolean","confirm_duplicate":"boolean"}',array['name','email','phone','communication','notes','active']);
 when 'hours' then
  perform private.validate_operation(p_input,'{"id":"string?","version":"number","unit_id":"string","professional_id":"string?","weekday":"number","start_time":"string","end_time":"string","delete":"boolean"}',array['unit_id','weekday','start_time','end_time']);
 when 'block' then
  perform private.validate_operation(p_input,'{"id":"string?","version":"number","unit_id":"string","professional_id":"string?","starts_at":"string","ends_at":"string","reason":"string","delete":"boolean"}',array['unit_id','starts_at','ends_at','reason']);
 else raise exception 'Invalid kind' using errcode='22023';
 end case;
 perform private.assert_entitlement(p_tenant,case p_kind when 'client' then 'clients' when 'service' then 'catalog' when 'professional' then 'team' else 'appointments' end);
 v_id:=coalesce((p_input->>'id')::uuid,gen_random_uuid());v_version:=coalesce((p_input->>'version')::int,0);v_delete:=coalesce((p_input->>'delete')::boolean,false);
 if p_kind='service' then
  insert into public.services(id,tenant_id,name,category,duration_minutes,preparation_minutes,price_cents,active)
  values(v_id,p_tenant,trim(p_input->>'name'),coalesce(p_input->>'category',''),(p_input->>'duration_minutes')::int,(p_input->>'preparation_minutes')::int,(p_input->>'price_cents')::int,(p_input->>'active')::boolean)
  on conflict(id) do update set name=excluded.name,category=excluded.category,duration_minutes=excluded.duration_minutes,preparation_minutes=excluded.preparation_minutes,price_cents=excluded.price_cents,active=excluded.active,version=services.version+1
  where services.tenant_id=p_tenant and services.version=v_version;
 elsif p_kind='professional' then
  if (p_input->>'active')::boolean and not exists(select 1 from public.professionals where tenant_id=p_tenant and id=v_id and active) then perform private.assert_entitlement(p_tenant,'team','professionals',1);end if;
  v_unit:=(p_input->>'unit_id')::uuid;
  if exists(select 1 from jsonb_array_elements(p_input->'service_ids') x where jsonb_typeof(x) is distinct from 'string') or jsonb_array_length(p_input->'service_ids')>100 then raise exception 'Invalid services' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements_text(p_input->'service_ids') x where not exists(select 1 from public.services where tenant_id=p_tenant and id=x::uuid)) then raise exception 'Invalid services' using errcode='22023';end if;
  if p_input->>'user_id' is not null and not exists(select 1 from public.memberships where tenant_id=p_tenant and user_id=(p_input->>'user_id')::uuid and active) then raise exception 'Invalid member' using errcode='22023';end if;
  if exists(select 1 from public.appointments a join public.professionals pr on pr.id=a.professional_id where a.tenant_id=p_tenant and a.professional_id=v_id and a.status<>'cancelled' and a.starts_at>now() and pr.unit_id<>v_unit) then raise exception 'Future appointments prevent unit change' using errcode='23P01';end if;
  insert into public.professionals(id,tenant_id,unit_id,name,service_ids,user_id,active)
  values(v_id,p_tenant,v_unit,trim(p_input->>'name'),array(select value::uuid from jsonb_array_elements_text(p_input->'service_ids')),(p_input->>'user_id')::uuid,(p_input->>'active')::boolean)
  on conflict(id) do update set unit_id=excluded.unit_id,name=excluded.name,service_ids=excluded.service_ids,user_id=excluded.user_id,active=excluded.active,version=professionals.version+1
  where professionals.tenant_id=p_tenant and professionals.version=v_version;
 elsif p_kind='client' then
  if not coalesce((p_input->>'confirm_duplicate')::boolean,false) and exists(select 1 from public.clients where tenant_id=p_tenant and id<>v_id and active and ((p_input->>'email'<>'' and lower(email)=lower(trim(p_input->>'email'))) or (length(regexp_replace(p_input->>'phone','[^0-9]','','g'))>=6 and regexp_replace(phone,'[^0-9]','','g')=regexp_replace(p_input->>'phone','[^0-9]','','g')))) then raise exception 'Potential duplicate client' using errcode='23505';end if;
  insert into public.clients(id,tenant_id,name,email,phone,communication,notes,active)
  values(v_id,p_tenant,trim(p_input->>'name'),lower(trim(p_input->>'email')),trim(p_input->>'phone'),p_input->>'communication',p_input->>'notes',(p_input->>'active')::boolean)
  on conflict(id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,communication=excluded.communication,notes=excluded.notes,active=excluded.active,version=clients.version+1
  where clients.tenant_id=p_tenant and clients.version=v_version;
 else
  v_unit:=(p_input->>'unit_id')::uuid;v_prof:=(p_input->>'professional_id')::uuid;
  if not exists(select 1 from public.units where tenant_id=p_tenant and id=v_unit) or (v_prof is not null and not exists(select 1 from public.professionals where tenant_id=p_tenant and id=v_prof and unit_id=v_unit)) then raise exception 'Invalid unit or professional' using errcode='22023';end if;
  if p_kind='block' and ((p_input->>'starts_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' or (p_input->>'ends_at')!~'(Z|[+-][0-9]{2}:[0-9]{2})$') then raise exception 'Explicit time offset required' using errcode='22023';end if;
  if p_kind='hours' then
   -- Changes to existing recurring intervals require handling future bookings first.
   if p_input->>'id' is not null and exists(select 1 from public.appointments where tenant_id=p_tenant and status<>'cancelled' and starts_at>now()) then raise exception 'Future appointments prevent hours change' using errcode='23P01';end if;
   if v_delete then
    delete from public.working_hours where tenant_id=p_tenant and id=v_id and version=v_version;
   else
    insert into public.working_hours(id,tenant_id,unit_id,professional_id,weekday,start_time,end_time)
    values(v_id,p_tenant,v_unit,v_prof,(p_input->>'weekday')::int,(p_input->>'start_time')::time,(p_input->>'end_time')::time)
    on conflict(id) do update set unit_id=excluded.unit_id,professional_id=excluded.professional_id,weekday=excluded.weekday,start_time=excluded.start_time,end_time=excluded.end_time,version=working_hours.version+1
    where working_hours.tenant_id=p_tenant and working_hours.version=v_version;
   end if;
  else
   if not v_delete and exists(select 1 from public.appointments where tenant_id=p_tenant and unit_id=v_unit and status<>'cancelled' and (v_prof is null or professional_id=v_prof) and starts_at<(p_input->>'ends_at')::timestamptz and busy_until>(p_input->>'starts_at')::timestamptz) then raise exception 'Block overlaps an appointment' using errcode='23P01';end if;
   if v_delete then
    delete from public.schedule_blocks where tenant_id=p_tenant and id=v_id and version=v_version;
   else
    insert into public.schedule_blocks(id,tenant_id,unit_id,professional_id,starts_at,ends_at,reason)
    values(v_id,p_tenant,v_unit,v_prof,(p_input->>'starts_at')::timestamptz,(p_input->>'ends_at')::timestamptz,trim(p_input->>'reason'))
    on conflict(id) do update set unit_id=excluded.unit_id,professional_id=excluded.professional_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,reason=excluded.reason,version=schedule_blocks.version+1
    where schedule_blocks.tenant_id=p_tenant and schedule_blocks.version=v_version;
   end if;
  end if;
 end if;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Record changed; reload before saving' using errcode='40001';end if;
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'operations.'||p_kind||case when v_delete then '.removed' else '.saved' end);
 return v_id;
end;
$$;

-- Shared availability rule, never exposed as a privilege-free RPC.
create function private.slot_error(p_tenant uuid,p_prof uuid,p_start timestamptz,p_duration int,p_prep int,p_ignore uuid default null) returns text
language plpgsql stable security definer set search_path='' as $$
declare v_unit uuid;v_zone text;v_local timestamp;v_end timestamp;v_until timestamptz;v_day int;
begin
 select p.unit_id,t.timezone into v_unit,v_zone from public.professionals p join public.tenants t on t.id=p.tenant_id where p.tenant_id=p_tenant and p.id=p_prof;
 if v_unit is null then return 'Invalid professional';end if;
 v_until:=p_start+make_interval(mins=>p_duration+p_prep);v_local:=p_start at time zone v_zone;v_end:=v_until at time zone v_zone;v_day:=extract(dow from v_local)::int;
 if (p_start at time zone v_zone)-(p_start at time zone 'UTC') is distinct from (v_until at time zone v_zone)-(v_until at time zone 'UTC') then return 'Clock change during appointment';end if;
 if v_local::date<>v_end::date or not exists(select 1 from public.working_hours where tenant_id=p_tenant and unit_id=v_unit and professional_id is null and weekday=v_day and start_time<=v_local::time and end_time>=v_end::time) then return 'Outside unit hours';end if;
 if not exists(select 1 from public.working_hours where tenant_id=p_tenant and professional_id=p_prof and unit_id=v_unit and weekday=v_day and start_time<=v_local::time and end_time>=v_end::time) then return 'Outside professional hours';end if;
 if exists(select 1 from public.schedule_blocks where tenant_id=p_tenant and unit_id=v_unit and (professional_id is null or professional_id=p_prof) and starts_at<v_until and ends_at>p_start) then return 'Blocked period';end if;
 if exists(select 1 from public.appointments where tenant_id=p_tenant and professional_id=p_prof and status<>'cancelled' and id is distinct from p_ignore and starts_at<v_until and busy_until>p_start) then return 'Appointment conflict';end if;
 return null;
end;
$$;
create function public.available_appointment_slots(p_tenant uuid,p_professional uuid,p_service uuid,p_date date,p_appointment uuid default null)
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
 return query select g from generate_series(p_date::timestamp at time zone v_zone,(p_date+1)::timestamp at time zone v_zone - interval '15 minutes',interval '15 minutes') g where g>now() and private.slot_error(p_tenant,p_professional,g,v_duration,v_prep,p_appointment) is null;
end;
$$;
create function public.mutate_appointment(p_tenant uuid,p_request uuid,p_input jsonb) returns uuid
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
  if v_appointment.version<>(p_input->>'version')::int then raise exception 'Appointment changed; reload' using errcode='40001';end if;
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
revoke all on function private.validate_operation(jsonb,jsonb,text[]),private.slot_error(uuid,uuid,timestamptz,int,int,uuid) from public,anon,authenticated;
revoke all on function public.save_operation_record(uuid,text,jsonb),public.available_appointment_slots(uuid,uuid,uuid,date,uuid),public.mutate_appointment(uuid,uuid,jsonb) from public,anon;
grant execute on function public.save_operation_record(uuid,text,jsonb),public.available_appointment_slots(uuid,uuid,uuid,date,uuid),public.mutate_appointment(uuid,uuid,jsonb) to authenticated;
create or replace function private.subscription_context(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.saas_subscriptions%rowtype;effective text;writable boolean;units_used int;members_used int;professionals_used int;
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
 select count(*) into professionals_used from public.professionals where tenant_id=p_tenant and active;
 return to_jsonb(s)||jsonb_build_object('effective_state',effective,'writable',writable,'units_used',units_used,'members_used',members_used,'professional_usage',professionals_used,'billing_mode','manual','payment_received',null);
end;
$$;
create or replace function private.assert_entitlement(p_tenant uuid,p_feature text,p_resource text default null,p_add int default 0) returns void language plpgsql security definer set search_path='' as $$
declare c jsonb;v_limit int;v_used int;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));c:=private.subscription_context(p_tenant);
 if not coalesce((c->>'writable')::boolean,false) then raise exception 'Subscription is read only; contact platform administrator' using errcode='42501';end if;
 if not coalesce((c->'plan_snapshot'->'features') ? p_feature,false) then raise exception 'Feature not included in plan' using errcode='42501';end if;
 if p_add<0 then raise exception 'Invalid usage change' using errcode='22023';end if;
 if p_resource='units' then v_limit:=(c->'plan_snapshot'->>'max_units')::int;v_used:=(c->>'units_used')::int;
 elsif p_resource='members' then v_limit:=(c->'plan_snapshot'->>'max_members')::int;v_used:=(c->>'members_used')::int;
 elsif p_resource='professionals' then v_limit:=(c->'plan_snapshot'->>'max_professionals')::int;v_used:=(c->>'professional_usage')::int;
 elsif p_resource is not null then raise exception 'Resource integration unavailable' using errcode='22023';end if;
 if p_resource is not null and p_add>0 and (v_limit is null or v_used+p_add>v_limit) then raise exception 'Plan limit reached' using errcode='23514';end if;
end;
$$;
create function public.operational_calendar(p_tenant uuid,p_date date,p_span int default 1) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_zone text;v_from timestamptz;v_to timestamptz;v_result jsonb;
begin
 if not private.has_role(p_tenant,array['owner','manager','reception','professional']::public.member_role[]) then raise exception 'Tenant access required' using errcode='42501';end if;
 if p_span is null or p_span not between 1 and 7 or p_date is null or p_date<'2000-01-01'::date or p_date>current_date+730 then raise exception 'Invalid calendar period' using errcode='22023';end if;
 select timezone into v_zone from public.tenants where id=p_tenant;v_from:=p_date::timestamp at time zone v_zone;v_to:=(p_date+p_span)::timestamp at time zone v_zone;
 select jsonb_agg(to_jsonb(x) order by x.starts_at) into v_result from (select a.*,c.name client_name from public.appointments a join public.clients c on c.tenant_id=a.tenant_id and c.id=a.client_id where a.tenant_id=p_tenant and a.starts_at>=v_from and a.starts_at<v_to and private.can_view_professional(p_tenant,a.professional_id) order by a.starts_at limit 1001) x;
 return jsonb_build_object('appointments',coalesce(v_result,'[]'),'timezone',v_zone,'from',v_from,'to',v_to);
end;
$$;
create function public.operational_member_options(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.has_role(p_tenant,array['owner','manager']::public.member_role[]) then raise exception 'Team permission required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'email',u.email,'role',m.role)) from public.memberships m join auth.users u on u.id=m.user_id where m.tenant_id=p_tenant and m.active),'[]');
end;
$$;
revoke all on function public.operational_calendar(uuid,date,int),public.operational_member_options(uuid) from public,anon;
grant execute on function public.operational_calendar(uuid,date,int),public.operational_member_options(uuid) to authenticated;
create function public.export_tenant_operations(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_foundation jsonb;
begin
 if not private.has_role(p_tenant,array['owner']::public.member_role[]) then raise exception 'Owner permission required' using errcode='42501';end if;
 v_foundation:=public.export_tenant_foundation(p_tenant);
 return v_foundation||jsonb_build_object('scope','foundation-and-operations','services',coalesce((select jsonb_agg(to_jsonb(x)) from public.services x where tenant_id=p_tenant),'[]'),'professionals',coalesce((select jsonb_agg(to_jsonb(x)) from public.professionals x where tenant_id=p_tenant),'[]'),'clients',coalesce((select jsonb_agg(to_jsonb(x)) from public.clients x where tenant_id=p_tenant),'[]'),'working_hours',coalesce((select jsonb_agg(to_jsonb(x)) from public.working_hours x where tenant_id=p_tenant),'[]'),'schedule_blocks',coalesce((select jsonb_agg(to_jsonb(x)) from public.schedule_blocks x where tenant_id=p_tenant),'[]'),'appointments',coalesce((select jsonb_agg(to_jsonb(x)) from public.appointments x where tenant_id=p_tenant),'[]'),'appointment_events',coalesce((select jsonb_agg(to_jsonb(x)) from public.appointment_events x where tenant_id=p_tenant),'[]'));
end;
$$;
revoke all on function public.export_tenant_operations(uuid) from public,anon;
grant execute on function public.export_tenant_operations(uuid) to authenticated;

commit;
