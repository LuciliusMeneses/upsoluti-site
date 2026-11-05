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
