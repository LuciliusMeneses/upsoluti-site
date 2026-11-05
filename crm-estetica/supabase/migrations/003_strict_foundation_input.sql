begin;
create or replace function public.create_establishment(p_input jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if jsonb_typeof(p_input) is distinct from 'object' then
   raise exception 'Invalid fields' using errcode='22023';
 end if;
 if (p_input - array['name','unit','locale','country','currency','timezone']) <> '{}'::jsonb or
    not (p_input ?& array['name','unit','locale','country','currency','timezone']) or
    exists(select 1 from jsonb_each(p_input) where jsonb_typeof(value) is distinct from 'string') then
   raise exception 'Invalid fields' using errcode='22023';
 end if;
 if length(trim(p_input->>'name')) not between 2 and 100 or length(trim(p_input->>'unit')) not between 2 and 100 then
   raise exception 'Invalid name' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 if (select count(*) from public.memberships where user_id=v_user and role='owner') >= 10 then
   raise exception 'Establishment limit reached' using errcode='23514';
 end if;
 insert into public.tenants(name,locale,country,currency,timezone)
 values(trim(p_input->>'name'),p_input->>'locale',p_input->>'country',p_input->>'currency',p_input->>'timezone') returning id into v_id;
 insert into public.memberships(tenant_id,user_id,role) values(v_id,v_user,'owner');
 insert into public.units(tenant_id,name) values(v_id,trim(p_input->>'unit'));
 insert into public.audit_events(tenant_id,actor_id,action) values(v_id,v_user,'establishment.created');
 return v_id;
end;
$$;
revoke all on function public.create_establishment(jsonb) from public,anon;
grant execute on function public.create_establishment(jsonb) to authenticated;
commit;
