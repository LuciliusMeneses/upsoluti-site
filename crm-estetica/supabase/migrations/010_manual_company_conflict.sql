-- Business conflicts must not trigger PostgREST serialization retries.
begin;
create or replace function public.platform_prepare_company(p_request uuid,p_input jsonb,p_fingerprint text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();r private.company_provision_requests%rowtype;u auth.users%rowtype;marker text;
begin
 if not private.is_platform_operator() then raise exception 'Platform access required' using errcode='42501';end if;
 if p_request is null or p_fingerprint is null or p_fingerprint!~'^[a-f0-9]{64}$' then raise exception 'Invalid request' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('company-provision:'||actor::text,0));
 select * into r from private.company_provision_requests where actor_id=actor and request_id=p_request;
 if found then
  if r.payload<>p_input or r.fingerprint<>p_fingerprint then raise exception 'Request key reused' using errcode='PT409';end if;
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

commit;
