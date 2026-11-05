begin;
-- Nullable numeric fields must remain integers too; PostgreSQL casts must not round input.
create or replace function private.validate_operation(p_input jsonb,p_types jsonb,p_required text[]) returns void language plpgsql set search_path='' as $$
declare field text;kind text;actual text;
begin
 if jsonb_typeof(p_input) is distinct from 'object' then raise exception 'Invalid fields' using errcode='22023';end if;
 if octet_length(p_input::text)>16000 or not p_input ?& p_required or exists(select 1 from jsonb_object_keys(p_input) k where not p_types ? k) then raise exception 'Invalid fields' using errcode='22023';end if;
 for field,kind in select * from jsonb_each_text(p_types) loop
  if p_input ? field then
   actual:=jsonb_typeof(p_input->field);
   if rtrim(kind,'?')='number' and actual<>'null' and (p_input->>field)!~'^[0-9]+$' then raise exception 'Integer value required' using errcode='22023';end if;
   if not (actual=rtrim(kind,'?') or (right(kind,1)='?' and actual='null')) then raise exception 'Invalid field type: %',field using errcode='22023';end if;
  end if;
 end loop;
end;$$;
create table public.package_templates(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),service_id uuid not null,name text not null check(length(trim(name)) between 2 and 100),
 sessions int not null check(sessions between 1 and 1000),price_cents int not null check(price_cents between 0 and 100000000),validity_days int check(validity_days between 1 and 3650),require_paid boolean not null default false,active boolean not null default true,version int not null default 1,
 foreign key(tenant_id,service_id) references public.services(tenant_id,id),unique(tenant_id,id)
);
create table public.client_packages(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),template_id uuid not null,client_id uuid not null,service_id uuid not null,name text not null,sessions int not null,price_cents int not null,currency text not null,expires_on date,require_paid boolean not null,
 cancelled_at timestamptz,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 foreign key(tenant_id,template_id) references public.package_templates(tenant_id,id),foreign key(tenant_id,client_id) references public.clients(tenant_id,id),foreign key(tenant_id,service_id) references public.services(tenant_id,id),unique(tenant_id,id)
);
create table public.service_fulfillments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),appointment_id uuid not null,package_id uuid,session_no int,base_cents int not null,currency text not null,
 reversed_at timestamptz,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 foreign key(tenant_id,appointment_id) references public.appointments(tenant_id,id),foreign key(tenant_id,package_id) references public.client_packages(tenant_id,id),unique(tenant_id,id),check((package_id is null and session_no is null) or (package_id is not null and session_no>0))
);
create unique index fulfillment_once on public.service_fulfillments(tenant_id,appointment_id) where reversed_at is null;
create unique index package_session_once on public.service_fulfillments(tenant_id,package_id,session_no) where reversed_at is null;
create table public.clinic_sales(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),client_id uuid not null,package_id uuid,fulfillment_id uuid,description text not null,amount_cents int not null check(amount_cents between 0 and 100000000),currency text not null,
 voided_at timestamptz,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 foreign key(tenant_id,client_id) references public.clients(tenant_id,id),foreign key(tenant_id,package_id) references public.client_packages(tenant_id,id),foreign key(tenant_id,fulfillment_id) references public.service_fulfillments(tenant_id,id),unique(tenant_id,id),unique(tenant_id,package_id),unique(tenant_id,fulfillment_id),check(num_nonnulls(package_id,fulfillment_id)=1)
);
create table public.clinic_installments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),sale_id uuid not null,number int not null,amount_cents int not null check(amount_cents>=0),due_on date not null,
 foreign key(tenant_id,sale_id) references public.clinic_sales(tenant_id,id),unique(tenant_id,id),unique(tenant_id,sale_id,number)
);
create table public.clinic_cash_movements(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),installment_id uuid,kind text not null check(kind in ('receipt','refund','expense','expense_refund')),amount_cents int not null check(amount_cents between 1 and 100000000),
 method text not null check(method in ('cash','transfer','card','other')),description text not null check(length(trim(description)) between 2 and 300),reverses_id uuid,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 foreign key(tenant_id,installment_id) references public.clinic_installments(tenant_id,id),foreign key(tenant_id,reverses_id) references public.clinic_cash_movements(tenant_id,id),unique(tenant_id,id),check((kind in ('receipt','refund'))=(installment_id is not null))
);
create table public.commission_rules(
 tenant_id uuid not null,professional_id uuid not null,service_id uuid not null,kind text not null check(kind in ('none','percent','fixed')),value int not null check(value between 0 and 100000000),version int not null default 1,
 primary key(tenant_id,professional_id,service_id),foreign key(tenant_id,professional_id) references public.professionals(tenant_id,id),foreign key(tenant_id,service_id) references public.services(tenant_id,id),check(kind<>'percent' or value<=10000)
);
create table public.clinic_commissions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,fulfillment_id uuid not null,professional_id uuid not null,base_cents int not null,rule_snapshot jsonb not null,amount_cents int not null,currency text not null,
 reversed_at timestamptz,created_at timestamptz not null default now(),
 foreign key(tenant_id,fulfillment_id) references public.service_fulfillments(tenant_id,id),foreign key(tenant_id,professional_id) references public.professionals(tenant_id,id),unique(tenant_id,id),unique(tenant_id,fulfillment_id)
);
create table public.commission_payments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,commission_id uuid not null,kind text not null check(kind in ('payment','reversal')),amount_cents int not null check(amount_cents>0),reason text not null check(length(trim(reason)) between 2 and 300),created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 foreign key(tenant_id,commission_id) references public.clinic_commissions(tenant_id,id),unique(tenant_id,id)
);
create table public.business_events(
 id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id),actor_id uuid not null references auth.users(id),action text not null,record_id uuid not null,reason text not null default '',created_at timestamptz not null default now()
);
create table private.business_requests(tenant_id uuid not null references public.tenants(id),request_id uuid not null,actor_id uuid not null references auth.users(id),payload jsonb not null,result_id uuid not null,primary key(tenant_id,request_id));
revoke all on private.business_requests from public,anon,authenticated;
create function private.can_manage_finance(p_tenant uuid) returns boolean language sql stable security definer set search_path='' as $$select private.has_role(p_tenant,array['owner','manager']::public.member_role[]);$$;
revoke all on function private.can_manage_finance(uuid) from public,anon;grant execute on function private.can_manage_finance(uuid) to authenticated;
do $$declare t text;begin
 foreach t in array array['package_templates','client_packages','service_fulfillments','clinic_sales','clinic_installments','clinic_cash_movements','commission_rules','clinic_commissions','commission_payments','business_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy business_read on public.%I for select to authenticated using(private.can_manage_finance(tenant_id))',t);
 end loop;
end$$;
create policy template_reception on public.package_templates for select to authenticated using(private.can_operate(tenant_id));
create policy package_reception on public.client_packages for select to authenticated using(private.can_operate(tenant_id));
create index business_cash_dates on public.clinic_cash_movements(tenant_id,created_at);
create index business_package_client on public.client_packages(tenant_id,client_id);
alter table public.appointments drop constraint appointments_status_check;
alter table public.appointments add constraint appointments_status_check check(status in ('scheduled','confirmed','cancelled','completed'));
alter function public.mutate_appointment(uuid,uuid,jsonb) set schema private;
alter function private.mutate_appointment(uuid,uuid,jsonb) rename to mutate_appointment_core;
revoke all on function private.mutate_appointment_core(uuid,uuid,jsonb) from public,anon,authenticated;
create function public.mutate_appointment(p_tenant uuid,p_request uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if not private.can_operate(p_tenant) then raise exception 'Forbidden' using errcode='42501';end if;
 -- Historical retry receipts are still checked by the core; completed visits cannot be edited.
 if exists(select 1 from public.appointments where tenant_id=p_tenant and id=(p_input->>'id')::uuid and status='completed') then raise exception 'Reverse completion before changing appointment' using errcode='23514';end if;
 return private.mutate_appointment_core(p_tenant,p_request,p_input);
end;$$;
revoke all on function public.mutate_appointment(uuid,uuid,jsonb) from public,anon;grant execute on function public.mutate_appointment(uuid,uuid,jsonb) to authenticated;
create function private.sale_received(p_tenant uuid,p_sale uuid) returns bigint language sql stable security definer set search_path='' as $$
 select coalesce(sum(case m.kind when 'receipt' then m.amount_cents else -m.amount_cents end),0) from public.clinic_cash_movements m join public.clinic_installments i on i.tenant_id=m.tenant_id and i.id=m.installment_id where i.tenant_id=p_tenant and i.sale_id=p_sale;
$$;
create function private.commission_paid(p_tenant uuid,p_commission uuid) returns bigint language sql stable security definer set search_path='' as $$select coalesce(sum(case kind when 'payment' then amount_cents else -amount_cents end),0) from public.commission_payments where tenant_id=p_tenant and commission_id=p_commission;$$;
create function private.make_installments(p_tenant uuid,p_sale uuid,p_amount int,p_count int,p_due date) returns void language plpgsql set search_path='' as $$
begin
 if p_count is null or p_count not between 1 and 12 or p_due is null or p_due<'2000-01-01'::date or p_due>current_date+3660 or (p_amount>0 and p_count>p_amount) then raise exception 'Invalid installments' using errcode='22023';end if;
 insert into public.clinic_installments(tenant_id,sale_id,number,amount_cents,due_on) select p_tenant,p_sale,g,p_amount/p_count+case when g<=p_amount%p_count then 1 else 0 end,(p_due+make_interval(months=>g-1))::date from generate_series(1,p_count) g;
end;$$;
revoke all on function private.sale_received(uuid,uuid),private.commission_paid(uuid,uuid),private.make_installments(uuid,uuid,int,int,date) from public,anon,authenticated;
create function public.manage_business(p_tenant uuid,p_request uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_action text;v_id uuid;v_old private.business_requests%rowtype;v_template public.package_templates%rowtype;v_package public.client_packages%rowtype;v_appt public.appointments%rowtype;v_f public.service_fulfillments%rowtype;v_sale public.clinic_sales%rowtype;v_i public.clinic_installments%rowtype;v_m public.clinic_cash_movements%rowtype;v_c public.clinic_commissions%rowtype;v_rule public.commission_rules%rowtype;
 v_zone text;v_currency text;v_today date;v_amount int;v_paid bigint;v_base int;v_slot int;v_count int;v_rate int;v_kind text;v_reason text;v_sale_id uuid;v_prof uuid;v_service uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,77));
 if not private.can_manage_finance(p_tenant) then raise exception 'Finance permission required' using errcode='42501';end if;
 if p_request is null then raise exception 'Request key required' using errcode='22023';end if;
 perform private.validate_operation(p_input,'{"action":"string","id":"string","version":"number","name":"string","service_id":"string","professional_id":"string","sessions":"number","price_cents":"number","validity_days":"number?","require_paid":"boolean","active":"boolean","client_id":"string","template_id":"string","installments":"number","due_on":"string","appointment_id":"string","package_id":"string?","amount_cents":"number","method":"string","reason":"string","kind":"string","value":"number"}',array['action']);
 v_action:=p_input->>'action';v_reason:=coalesce(trim(p_input->>'reason'),'');
 perform private.assert_entitlement(p_tenant,case when v_action in ('save_template','sell_package','cancel_package') then 'packages' when v_action in ('complete','reverse_completion') then 'appointments' else 'finance' end);
 select * into v_old from private.business_requests where tenant_id=p_tenant and request_id=p_request;
 if found then if v_old.actor_id<>auth.uid() or v_old.payload<>p_input then raise exception 'Request key reused' using errcode='22023';end if;return v_old.result_id;end if;
 select timezone,currency into v_zone,v_currency from public.tenants where id=p_tenant;v_today:=(now() at time zone v_zone)::date;
 if v_action in ('refund','expense','expense_refund','cancel_package','reverse_completion','pay_commission','reverse_commission_payment') and length(v_reason) not between 2 and 300 then raise exception 'Reason required' using errcode='22023';end if;
 if v_action='save_template' then
  perform private.validate_operation(p_input,'{"action":"string","id":"string","version":"number","name":"string","service_id":"string","sessions":"number","price_cents":"number","validity_days":"number?","require_paid":"boolean","active":"boolean"}',array['name','service_id','sessions','price_cents','require_paid','active']);
  if not exists(select 1 from public.services where tenant_id=p_tenant and id=(p_input->>'service_id')::uuid) then raise exception 'Invalid service' using errcode='22023';end if;
  v_id:=coalesce((p_input->>'id')::uuid,gen_random_uuid());
  insert into public.package_templates(id,tenant_id,service_id,name,sessions,price_cents,validity_days,require_paid,active) values(v_id,p_tenant,(p_input->>'service_id')::uuid,trim(p_input->>'name'),(p_input->>'sessions')::int,(p_input->>'price_cents')::int,(p_input->>'validity_days')::int,(p_input->>'require_paid')::boolean,(p_input->>'active')::boolean)
  on conflict(id) do update set service_id=excluded.service_id,name=excluded.name,sessions=excluded.sessions,price_cents=excluded.price_cents,validity_days=excluded.validity_days,require_paid=excluded.require_paid,active=excluded.active,version=package_templates.version+1 where package_templates.tenant_id=p_tenant and package_templates.version=(p_input->>'version')::int;
  get diagnostics v_count=row_count;if v_count<>1 then raise exception 'Record changed' using errcode='40001';end if;
 elsif v_action='sell_package' then
  perform private.assert_entitlement(p_tenant,'finance');
  select * into v_template from public.package_templates where tenant_id=p_tenant and id=(p_input->>'template_id')::uuid and active;
  if not found or not exists(select 1 from public.services where tenant_id=p_tenant and id=v_template.service_id and active) or not exists(select 1 from public.clients where tenant_id=p_tenant and id=(p_input->>'client_id')::uuid and active) then raise exception 'Invalid package or client' using errcode='22023';end if;
  insert into public.client_packages(tenant_id,template_id,client_id,service_id,name,sessions,price_cents,currency,expires_on,require_paid,created_by) values(p_tenant,v_template.id,(p_input->>'client_id')::uuid,v_template.service_id,v_template.name,v_template.sessions,v_template.price_cents,v_currency,v_today+v_template.validity_days,v_template.require_paid,auth.uid()) returning id into v_id;
  insert into public.clinic_sales(tenant_id,client_id,package_id,description,amount_cents,currency,created_by) values(p_tenant,(p_input->>'client_id')::uuid,v_id,v_template.name,v_template.price_cents,v_currency,auth.uid()) returning id into v_sale_id;
  perform private.make_installments(p_tenant,v_sale_id,v_template.price_cents,coalesce((p_input->>'installments')::int,1),coalesce((p_input->>'due_on')::date,v_today));
 elsif v_action='cancel_package' then
  perform private.assert_entitlement(p_tenant,'finance');select * into v_package from public.client_packages where tenant_id=p_tenant and id=(p_input->>'id')::uuid and cancelled_at is null;
  if not found then raise exception 'Package unavailable' using errcode='22023';end if;
  select * into v_sale from public.clinic_sales where tenant_id=p_tenant and package_id=v_package.id;
  if private.sale_received(p_tenant,v_sale.id)<>0 or exists(select 1 from public.service_fulfillments where tenant_id=p_tenant and package_id=v_package.id and reversed_at is null) then raise exception 'Reverse sessions and refund payments before cancelling package' using errcode='23514';end if;
  update public.client_packages set cancelled_at=now() where id=v_package.id;update public.clinic_sales set voided_at=now() where id=v_sale.id;v_id:=v_package.id;
 elsif v_action='set_commission' then
  v_prof:=(p_input->>'professional_id')::uuid;v_service:=(p_input->>'service_id')::uuid;v_rate:=(p_input->>'value')::int;v_kind:=p_input->>'kind';
  if not p_input ?& array['professional_id','service_id','value','kind','version'] or not exists(select 1 from public.professionals where tenant_id=p_tenant and id=v_prof) or not exists(select 1 from public.services where tenant_id=p_tenant and id=v_service) then raise exception 'Invalid rule' using errcode='22023';end if;
  insert into public.commission_rules(tenant_id,professional_id,service_id,kind,value) values(p_tenant,v_prof,v_service,v_kind,v_rate) on conflict(tenant_id,professional_id,service_id) do update set kind=excluded.kind,value=excluded.value,version=commission_rules.version+1 where commission_rules.version=(p_input->>'version')::int;
  get diagnostics v_count=row_count;if v_count<>1 then raise exception 'Rule changed' using errcode='40001';end if;v_id:=v_prof;
 elsif v_action='complete' then
  perform private.assert_entitlement(p_tenant,'finance');select * into v_appt from public.appointments where tenant_id=p_tenant and id=(p_input->>'appointment_id')::uuid for update;
  if not found or v_appt.status not in ('scheduled','confirmed') or v_appt.version is distinct from (p_input->>'version')::int then raise exception 'Appointment changed or unavailable' using errcode='40001';end if;
  if v_appt.ends_at>now() then raise exception 'Appointment has not ended' using errcode='23514';end if;
  v_base:=v_appt.price_cents;
  if p_input->>'package_id' is not null then
   perform private.assert_entitlement(p_tenant,'packages');select * into v_package from public.client_packages where tenant_id=p_tenant and id=(p_input->>'package_id')::uuid;
   if not found or v_package.cancelled_at is not null or v_package.client_id<>v_appt.client_id or v_package.service_id<>v_appt.service_id or v_package.expires_on<v_today then raise exception 'Package unavailable or expired' using errcode='23514';end if;
   select * into v_sale from public.clinic_sales where tenant_id=p_tenant and package_id=v_package.id;
   if v_package.require_paid and private.sale_received(p_tenant,v_sale.id)<v_sale.amount_cents then raise exception 'Package requires full payment' using errcode='23514';end if;
   select min(g) into v_slot from generate_series(1,v_package.sessions) g where not exists(select 1 from public.service_fulfillments where tenant_id=p_tenant and package_id=v_package.id and session_no=g and reversed_at is null);
   if v_slot is null then raise exception 'No sessions remaining' using errcode='23514';end if;
   v_base:=v_package.price_cents/v_package.sessions+case when v_slot<=v_package.price_cents%v_package.sessions then 1 else 0 end;
  end if;
  insert into public.service_fulfillments(tenant_id,appointment_id,package_id,session_no,base_cents,currency,created_by) values(p_tenant,v_appt.id,v_package.id,v_slot,v_base,v_appt.currency,auth.uid()) returning id into v_id;
  if v_package.id is null then
   insert into public.clinic_sales(tenant_id,client_id,fulfillment_id,description,amount_cents,currency,created_by) values(p_tenant,v_appt.client_id,v_id,v_appt.service_name,v_base,v_appt.currency,auth.uid()) returning id into v_sale_id;
   perform private.make_installments(p_tenant,v_sale_id,v_base,1,v_today);
  end if;
  select * into v_rule from public.commission_rules where tenant_id=p_tenant and professional_id=v_appt.professional_id and service_id=v_appt.service_id;
  v_amount:=case coalesce(v_rule.kind,'none') when 'percent' then ((v_base::bigint*v_rule.value+5000)/10000)::int when 'fixed' then v_rule.value else 0 end;
  insert into public.clinic_commissions(tenant_id,fulfillment_id,professional_id,base_cents,rule_snapshot,amount_cents,currency) values(p_tenant,v_id,v_appt.professional_id,v_base,jsonb_build_object('kind',coalesce(v_rule.kind,'none'),'value',coalesce(v_rule.value,0),'version',v_rule.version,'event','completion'),v_amount,v_appt.currency);
  update public.appointments set status='completed',version=version+1,updated_at=now() where tenant_id=p_tenant and id=v_appt.id;
  insert into public.appointment_events(tenant_id,appointment_id,actor_id,action,starts_at,status) values(p_tenant,v_appt.id,auth.uid(),'complete',v_appt.starts_at,'completed');
 elsif v_action='reverse_completion' then
  perform private.assert_entitlement(p_tenant,'finance');select * into v_f from public.service_fulfillments where tenant_id=p_tenant and id=(p_input->>'id')::uuid and reversed_at is null;
  if not found then raise exception 'Completion unavailable' using errcode='22023';end if;
  if v_f.package_id is not null then perform private.assert_entitlement(p_tenant,'packages');end if;
  select * into v_c from public.clinic_commissions where tenant_id=p_tenant and fulfillment_id=v_f.id;
  if private.commission_paid(p_tenant,v_c.id)<>0 then raise exception 'Reverse commission payment first' using errcode='23514';end if;
  select * into v_sale from public.clinic_sales where tenant_id=p_tenant and fulfillment_id=v_f.id;
  if v_sale.id is not null and private.sale_received(p_tenant,v_sale.id)<>0 then raise exception 'Refund sale first' using errcode='23514';end if;
  update public.service_fulfillments set reversed_at=now() where id=v_f.id;update public.clinic_commissions set reversed_at=now() where id=v_c.id;update public.clinic_sales set voided_at=now() where id=v_sale.id;
  update public.appointments set status='confirmed',version=version+1,updated_at=now() where tenant_id=p_tenant and id=v_f.appointment_id returning * into v_appt;
  insert into public.appointment_events(tenant_id,appointment_id,actor_id,action,reason,starts_at,status) values(p_tenant,v_appt.id,auth.uid(),'reverse_completion',v_reason,v_appt.starts_at,'confirmed');v_id:=v_f.id;
 elsif v_action in ('receipt','refund') then
  select * into v_i from public.clinic_installments where tenant_id=p_tenant and id=(p_input->>'id')::uuid;
  select * into v_sale from public.clinic_sales where tenant_id=p_tenant and id=v_i.sale_id and voided_at is null;
  if v_i.id is null or v_sale.id is null then raise exception 'Installment unavailable' using errcode='22023';end if;
  v_amount:=(p_input->>'amount_cents')::int;
  select coalesce(sum(case kind when 'receipt' then amount_cents else -amount_cents end),0) into v_paid from public.clinic_cash_movements where tenant_id=p_tenant and installment_id=v_i.id;
  if v_amount is null or v_amount<=0 or (v_action='receipt' and v_paid+v_amount>v_i.amount_cents) or (v_action='refund' and v_amount>v_paid) then raise exception 'Amount exceeds available balance' using errcode='23514';end if;
  insert into public.clinic_cash_movements(tenant_id,installment_id,kind,amount_cents,method,description,created_by) values(p_tenant,v_i.id,v_action,v_amount,p_input->>'method',case when v_action='refund' then v_reason else 'Recebimento manual' end,auth.uid()) returning id into v_id;
 elsif v_action='expense' then
  insert into public.clinic_cash_movements(tenant_id,kind,amount_cents,method,description,created_by) values(p_tenant,'expense',(p_input->>'amount_cents')::int,p_input->>'method',v_reason,auth.uid()) returning id into v_id;
 elsif v_action='expense_refund' then
  select * into v_m from public.clinic_cash_movements where tenant_id=p_tenant and id=(p_input->>'id')::uuid and kind='expense';
  select coalesce(sum(amount_cents),0) into v_paid from public.clinic_cash_movements where tenant_id=p_tenant and reverses_id=v_m.id;
  v_amount:=(p_input->>'amount_cents')::int;if v_m.id is null or v_amount is null or v_amount<=0 or v_amount+v_paid>v_m.amount_cents then raise exception 'Expense reversal exceeds balance' using errcode='23514';end if;
  insert into public.clinic_cash_movements(tenant_id,kind,amount_cents,method,description,reverses_id,created_by) values(p_tenant,'expense_refund',v_amount,v_m.method,v_reason,v_m.id,auth.uid()) returning id into v_id;
 elsif v_action in ('pay_commission','reverse_commission_payment') then
  select * into v_c from public.clinic_commissions where tenant_id=p_tenant and id=(p_input->>'id')::uuid and reversed_at is null;
  if not found then raise exception 'Commission unavailable' using errcode='22023';end if;
  v_paid:=private.commission_paid(p_tenant,v_c.id);v_amount:=case when v_action='pay_commission' then v_c.amount_cents-v_paid else v_paid end;
  if v_amount<=0 then raise exception 'No commission balance' using errcode='23514';end if;
  insert into public.commission_payments(tenant_id,commission_id,kind,amount_cents,reason,created_by) values(p_tenant,v_c.id,case when v_action='pay_commission' then 'payment' else 'reversal' end,v_amount,v_reason,auth.uid()) returning id into v_id;
 else raise exception 'Invalid business action' using errcode='22023';end if;
 insert into public.business_events(tenant_id,actor_id,action,record_id,reason) values(p_tenant,auth.uid(),v_action,v_id,v_reason);
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'business.'||v_action);
 insert into private.business_requests(tenant_id,request_id,actor_id,payload,result_id) values(p_tenant,p_request,auth.uid(),p_input,v_id);return v_id;
end;$$;
revoke all on function public.manage_business(uuid,uuid,jsonb) from public,anon;grant execute on function public.manage_business(uuid,uuid,jsonb) to authenticated;
create function public.business_data(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.can_manage_finance(p_tenant) then raise exception 'Finance permission required' using errcode='42501';end if;
 return jsonb_build_object(
 'templates',coalesce((select jsonb_agg(to_jsonb(x)) from (select t.*,s.name service_name from public.package_templates t join public.services s on s.tenant_id=t.tenant_id and s.id=t.service_id where t.tenant_id=p_tenant order by t.name limit 1001)x),'[]'),
 'packages',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.*,c.name client_name,(select count(*) from public.service_fulfillments f where f.tenant_id=p_tenant and f.package_id=p.id and f.reversed_at is null) used from public.client_packages p join public.clients c on c.tenant_id=p.tenant_id and c.id=p.client_id where p.tenant_id=p_tenant order by p.created_at desc limit 1001)x),'[]'),
 'installments',coalesce((select jsonb_agg(to_jsonb(x)) from (select i.*,s.description,s.client_id,c.name client_name,s.voided_at,s.currency,coalesce((select sum(case m.kind when 'receipt' then m.amount_cents else -m.amount_cents end) from public.clinic_cash_movements m where m.tenant_id=p_tenant and m.installment_id=i.id),0) received_cents from public.clinic_installments i join public.clinic_sales s on s.tenant_id=i.tenant_id and s.id=i.sale_id join public.clients c on c.tenant_id=s.tenant_id and c.id=s.client_id where i.tenant_id=p_tenant order by i.due_on desc,i.number limit 1001)x),'[]'),
 'cash',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.clinic_cash_movements where tenant_id=p_tenant order by created_at desc limit 1001)x),'[]'),
 'commissions',coalesce((select jsonb_agg(to_jsonb(x)) from (select c.*,p.name professional_name,a.service_name,private.commission_paid(p_tenant,c.id) paid_cents from public.clinic_commissions c join public.professionals p on p.tenant_id=c.tenant_id and p.id=c.professional_id join public.service_fulfillments f on f.tenant_id=c.tenant_id and f.id=c.fulfillment_id join public.appointments a on a.tenant_id=f.tenant_id and a.id=f.appointment_id where c.tenant_id=p_tenant order by c.created_at desc limit 1001)x),'[]'),
 'rules',coalesce((select jsonb_agg(to_jsonb(x)) from public.commission_rules x where tenant_id=p_tenant),'[]'),
 'fulfillments',coalesce((select jsonb_agg(to_jsonb(x)) from (select f.*,a.client_id,a.service_name,a.professional_name from public.service_fulfillments f join public.appointments a on a.tenant_id=f.tenant_id and a.id=f.appointment_id where f.tenant_id=p_tenant order by f.created_at desc limit 1001)x),'[]'),
 'events',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.business_events where tenant_id=p_tenant order by id desc limit 1001)x),'[]'));
end;$$;
revoke all on function public.business_data(uuid) from public,anon;grant execute on function public.business_data(uuid) to authenticated;
create function public.clinic_report(p_tenant uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_zone text;v_currency text;v_start timestamptz;v_end timestamptz;v_today date;
begin
 if not private.can_manage_finance(p_tenant) then raise exception 'Report permission required' using errcode='42501';end if;
 if not coalesce((private.subscription_context(p_tenant)->'plan_snapshot'->'features')?'reports',false) then raise exception 'Reports not in plan' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>366 or p_from<'2000-01-01'::date then raise exception 'Invalid report period' using errcode='22023';end if;
 select timezone,currency into v_zone,v_currency from public.tenants where id=p_tenant;v_start:=p_from::timestamp at time zone v_zone;v_end:=(p_to+1)::timestamp at time zone v_zone;v_today:=(now() at time zone v_zone)::date;
 return jsonb_build_object('from',p_from,'to',p_to,'timezone',v_zone,'currency',v_currency,
 'appointments',coalesce((select jsonb_object_agg(status,n) from (select status,count(*) n from public.appointments where tenant_id=p_tenant and starts_at>=v_start and starts_at<v_end group by status)x),'{}'),
 'booked_minutes',(select coalesce(sum(duration_minutes),0) from public.appointments where tenant_id=p_tenant and starts_at>=v_start and starts_at<v_end and status<>'cancelled'),
 'sales_cents',(select coalesce(sum(amount_cents),0) from public.clinic_sales where tenant_id=p_tenant and created_at>=v_start and created_at<v_end and voided_at is null),
 'received_cents',(select coalesce(sum(case kind when 'receipt' then amount_cents when 'refund' then -amount_cents else 0 end),0) from public.clinic_cash_movements where tenant_id=p_tenant and created_at>=v_start and created_at<v_end),
 'expenses_cents',(select coalesce(sum(case kind when 'expense' then amount_cents when 'expense_refund' then -amount_cents else 0 end),0) from public.clinic_cash_movements where tenant_id=p_tenant and created_at>=v_start and created_at<v_end),
 'commissions_paid_cents',(select coalesce(sum(case kind when 'payment' then amount_cents else -amount_cents end),0) from public.commission_payments where tenant_id=p_tenant and created_at>=v_start and created_at<v_end),
 'open_cents',(select coalesce(sum(s.amount_cents-private.sale_received(p_tenant,s.id)),0) from public.clinic_sales s where tenant_id=p_tenant and voided_at is null),
 'overdue_cents',(select coalesce(sum(i.amount_cents-coalesce((select sum(case kind when 'receipt' then amount_cents else -amount_cents end) from public.clinic_cash_movements where tenant_id=p_tenant and installment_id=i.id),0)),0) from public.clinic_installments i join public.clinic_sales s on s.tenant_id=i.tenant_id and s.id=i.sale_id where i.tenant_id=p_tenant and s.voided_at is null and i.due_on<v_today),
 'commissions_due_cents',(select coalesce(sum(amount_cents-private.commission_paid(p_tenant,id)),0) from public.clinic_commissions where tenant_id=p_tenant and reversed_at is null),
 'packages_expiring',(select count(*) from public.client_packages p where tenant_id=p_tenant and cancelled_at is null and expires_on between v_today and v_today+30 and sessions>(select count(*) from public.service_fulfillments where tenant_id=p_tenant and package_id=p.id and reversed_at is null)),
 'clients_without_next',(select count(*) from public.clients c where tenant_id=p_tenant and active and not exists(select 1 from public.appointments where tenant_id=p_tenant and client_id=c.id and status in ('scheduled','confirmed') and starts_at>now())));
end;$$;
revoke all on function public.clinic_report(uuid,date,date) from public,anon;grant execute on function public.clinic_report(uuid,date,date) to authenticated;
-- Keep the existing export name compatible and add the delivered business records.
alter function public.export_tenant_operations(uuid) set schema private;
alter function private.export_tenant_operations(uuid) rename to export_operations_base;
revoke all on function private.export_operations_base(uuid) from public,anon,authenticated;
create function public.export_tenant_operations(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_table text;v_rows jsonb;
begin
 v_data:=private.export_operations_base(p_tenant);
 foreach v_table in array array['package_templates','client_packages','service_fulfillments','clinic_sales','clinic_installments','clinic_cash_movements','commission_rules','clinic_commissions','commission_payments','business_events'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from public.%I x where tenant_id=$1',v_table) into v_rows using p_tenant;v_data:=v_data||jsonb_build_object(v_table,v_rows);
 end loop;return v_data||jsonb_build_object('scope','foundation-operations-and-business');
end;$$;
revoke all on function public.export_tenant_operations(uuid) from public,anon;grant execute on function public.export_tenant_operations(uuid) to authenticated;
commit;
