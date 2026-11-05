begin;
lock table public.saas_subscriptions in share row exclusive mode;
insert into private.platform_audit(tenant_id,action,reason,details) select tenant_id,'subscription.snapshot.initial','Commercial history baseline',jsonb_build_object('before',null,'after',to_jsonb(s)) from public.saas_subscriptions s;
create function private.capture_subscription_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.platform_audit(actor_id,tenant_id,action,details) values(auth.uid(),new.tenant_id,'subscription.snapshot',jsonb_build_object('before',case when tg_op='UPDATE' then to_jsonb(old) else null end,'after',to_jsonb(new)));
 return new;
end;
$$;
revoke all on function private.capture_subscription_history() from public,anon,authenticated;
create trigger subscription_history after insert or update on public.saas_subscriptions for each row execute function private.capture_subscription_history();
create or replace function public.export_tenant_foundation(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.has_role(p_tenant,array['owner']::public.member_role[]) then raise exception 'Export permission required' using errcode='42501';end if;
 select jsonb_build_object('scope','foundation-only','exported_at',now(),'tenant',to_jsonb(t),'units',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'created_at',created_at)) from public.units where tenant_id=p_tenant),'[]'),'membership_counts',jsonb_build_object('active',(select count(*) from public.memberships where tenant_id=p_tenant and active)),'subscription',private.subscription_context(p_tenant),
 'subscription_history',coalesce((select jsonb_agg(jsonb_build_object('at',created_at,'actor_id',actor_id,'before',details->'before','after',details->'after') order by id) from private.platform_audit where tenant_id=p_tenant and action in ('subscription.snapshot','subscription.snapshot.initial')),'[]')) into result from public.tenants t where id=p_tenant;
 insert into public.audit_events(tenant_id,actor_id,action) values(p_tenant,auth.uid(),'foundation.exported');return result;
end;
$$;
commit;
