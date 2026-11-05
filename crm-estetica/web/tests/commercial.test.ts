import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,beforeEach,afterEach,afterAll,it,expect} from 'vitest';
const db=new PGlite();
const operator='00000000-0000-0000-0000-000000000010',owner='00000000-0000-0000-0000-000000000011',other='00000000-0000-0000-0000-000000000012';
const planInput={code:'qa-plan',name:'QA synthetic',price_cents:12000,currency:'EUR',interval_months:12,trial_days:7,grace_days:2,max_units:2,max_professionals:3,max_members:2,features:['settings','team'],published:true};
const company=(plan_id:string,request_id=crypto.randomUUID())=>({name:'QA center',unit:'First unit',locale:'pt-PT',country:'PT',currency:'EUR',timezone:'Europe/Lisbon',plan_id,request_id});
async function user(id:string){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);await db.exec('set local role authenticated')}
async function rpc<T=unknown>(name:string,args:unknown[]=[]):Promise<T>{const r=await db.query<{result:T}>(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args);return r.rows[0].result}
async function fixture(){await user(operator);const plan=await rpc<string>('platform_create_plan',[JSON.stringify(planInput)]);await user(owner);const tenant=await rpc<string>('create_establishment',[JSON.stringify(company(plan))]);return {plan,tenant}}
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table storage.buckets(id text primary key,name text,public boolean);`);
 for(const [id,email] of [[operator,'operator@example.test'],[owner,'owner@example.test'],[other,'other@example.test']])await db.query('insert into auth.users values($1,$2,now())',[id,email]);
 for(const file of ['001_foundation.sql','002_invitations.sql','003_strict_foundation_input.sql','004_commercial.sql','005_subscription_history.sql'])await db.exec(readFileSync(new URL(`../../supabase/migrations/${file}`,import.meta.url),'utf8'));
 await db.query('insert into private.platform_operators(user_id) values($1)',[operator]);
},30000);
beforeEach(async()=>{await db.exec('begin')});afterEach(async()=>{await db.exec('rollback')});afterAll(async()=>{await db.close()});
it('separates platform operators from tenant owners and denies direct commercial writes',async()=>{
 const {tenant}=await fixture();expect(await rpc('platform_access')).toBe(false);
 await expect(rpc('platform_overview')).rejects.toThrow();
 // Recover from expected SQL errors via savepoints for further assertions.
});
it('creates tenant and subscription atomically and rejects mismatched request retries',async()=>{
 await user(operator);const p=await rpc<string>('platform_create_plan',[JSON.stringify(planInput)]);await user(owner);
 const input=company(p);const a=await rpc('create_establishment',[JSON.stringify(input)]);expect(await rpc('create_establishment',[JSON.stringify(input)])).toBe(a);
 const c=await rpc<any>('tenant_subscription',[a]);expect(c.effective_state).toBe('trialing');expect(c.units_used).toBe(1);expect(c.members_used).toBe(1);
 await expect(rpc('create_establishment',[JSON.stringify({...input,name:'Changed'})])).rejects.toThrow();
});
it('enforces unit quotas, idempotence and immutable snapshots',async()=>{
 const {tenant,plan}=await fixture();const request=crypto.randomUUID();const unit=await rpc('create_tenant_unit',[tenant,request,'Second unit']);expect(await rpc('create_tenant_unit',[tenant,request,'Second unit'])).toBe(unit);
 await user(operator);await rpc('platform_create_plan',[JSON.stringify({...planInput,max_units:8})]);await user(owner);
 const c=await rpc<any>('tenant_subscription',[tenant]);expect(c.plan_id).toBe(plan);expect(c.plan_snapshot.max_units).toBe(2);
 await expect(rpc('create_tenant_unit',[tenant,crypto.randomUUID(),'Third unit'])).rejects.toThrow();
});
it('evaluates trial expiry at request time and preserves read/export',async()=>{
 const {tenant}=await fixture();await db.exec('reset role');await db.query("update public.saas_subscriptions set period_start=now()-interval '10 days',period_end=now()-interval '1 day' where tenant_id=$1",[tenant]);await user(owner);
 const c=await rpc<any>('tenant_subscription',[tenant]);expect(c.effective_state).toBe('expired');expect(c.writable).toBe(false);expect((await rpc<any>('export_tenant_foundation',[tenant])).scope).toBe('foundation-only');
 await expect(rpc('create_tenant_unit',[tenant,crypto.randomUUID(),'Blocked'])).rejects.toThrow();
});
it('prevents cross-tenant subscription reads and exports',async()=>{const {tenant}=await fixture();await user(other);await expect(rpc('tenant_subscription',[tenant])).rejects.toThrow()});
it('denies direct plan, subscription and operator writes by tenant owner',async()=>{await fixture();await expect(db.exec("update public.saas_plans set price_cents=0")).rejects.toThrow()});
it('allows only published plans to provision; paid plans start pending',async()=>{
 await user(operator);const plan=await rpc<string>('platform_create_plan',[JSON.stringify({...planInput,trial_days:0})]);await user(owner);const tenant=await rpc('create_establishment',[JSON.stringify(company(plan))]);expect((await rpc<any>('tenant_subscription',[tenant])).effective_state).toBe('pending');
 await user(operator);await rpc('platform_publish_plan',[plan,false]);await user(other);await expect(rpc('create_establishment',[JSON.stringify(company(plan))])).rejects.toThrow();
});
it('manages manual state with optimistic versions and excludes trialing from MRR',async()=>{
 const {tenant,plan}=await fixture();await user(operator);
 expect((await rpc<any>('platform_overview')).mrr).toEqual([]);
 await rpc('platform_set_subscription',[tenant,JSON.stringify({version:1,plan_id:plan,state:'active',period_end:new Date(Date.now()+86400000*30).toISOString(),cancel_at_period_end:false,reason:'Synthetic activation'})]);
 const data=await rpc<any>('platform_overview');expect(Number(data.mrr[0].cents)).toBe(1000);expect(data.companies[0].subscription.payment_received).toBe(null);
 await expect(rpc('platform_set_subscription',[tenant,JSON.stringify({version:1,state:'cancelled',period_end:new Date(Date.now()+86400000).toISOString(),cancel_at_period_end:false,reason:'Stale version'})])).rejects.toThrow();
});
it('blocks new invitations after effective cancellation without erasing tenant',async()=>{
 const {tenant,plan}=await fixture();await user(operator);await rpc('platform_set_subscription',[tenant,JSON.stringify({version:1,plan_id:plan,state:'cancelled',period_end:new Date(Date.now()+86400000).toISOString(),cancel_at_period_end:false,reason:'Synthetic cancellation'})]);
 await user(owner);expect((await rpc<any>('export_tenant_foundation',[tenant])).tenant.id).toBe(tenant);await expect(rpc('create_member_invitation',[tenant,'other@example.test','manager'])).rejects.toThrow();
});
it('keeps unpublished plans out of public catalog and denies anonymous provisioning',async()=>{
 await user(operator);await rpc('platform_create_plan',[JSON.stringify({...planInput,published:false})]);await db.exec('reset role;set local role anon');expect(await rpc('public_plan_catalog')).toEqual([]);await expect(rpc('create_establishment',['{}'])).rejects.toThrow();
});
it('enforces member limits when invitation is accepted, not by hiding buttons',async()=>{
 const {tenant}=await fixture();const token=await rpc<string>('create_member_invitation',[tenant,'other@example.test','manager']);await user(other);expect(await rpc('accept_member_invitation',[token])).toBe(tenant);
 await user(owner);const overflow=await rpc<string>('create_member_invitation',[tenant,'operator@example.test','professional']);await user(operator);await expect(rpc('accept_member_invitation',[overflow])).rejects.toThrow();
});
it('enforces past-due grace expiry and scheduled cancellation without deletion',async()=>{
 const {tenant}=await fixture();await db.exec('reset role');await db.query("update public.saas_subscriptions set state='past_due',period_start=now()-interval '5 days',grace_until=now()-interval '1 day' where tenant_id=$1",[tenant]);await user(owner);expect((await rpc<any>('tenant_subscription',[tenant])).effective_state).toBe('restricted');
 await db.exec('reset role');await db.query("update public.saas_subscriptions set state='active',cancel_at_period_end=true,period_end=now()-interval '1 hour' where tenant_id=$1",[tenant]);await user(owner);expect((await rpc<any>('tenant_subscription',[tenant])).effective_state).toBe('cancelled');expect((await rpc<any>('export_tenant_foundation',[tenant])).tenant.id).toBe(tenant);
});
it('preserves existing units on downgrade and rejects only new additions',async()=>{
 const {tenant}=await fixture();await rpc('create_tenant_unit',[tenant,crypto.randomUUID(),'Second unit']);await user(operator);const lower=await rpc('platform_create_plan',[JSON.stringify({...planInput,code:'qa-lower',max_units:1})]);await rpc('platform_set_subscription',[tenant,JSON.stringify({version:1,plan_id:lower,state:'active',period_end:new Date(Date.now()+86400000).toISOString(),cancel_at_period_end:false,reason:'Synthetic downgrade'})]);await user(owner);expect((await rpc<any>('tenant_subscription',[tenant])).units_used).toBe(2);await expect(rpc('create_tenant_unit',[tenant,crypto.randomUUID(),'Third unit'])).rejects.toThrow();
});
it('revoked platform operator loses privileges immediately without relying on JWT metadata',async()=>{
 await user(operator);expect(await rpc('platform_access')).toBe(true);await db.exec('reset role');await db.query('update private.platform_operators set active=false where user_id=$1',[operator]);await user(operator);expect(await rpc('platform_access')).toBe(false);await expect(rpc('platform_overview')).rejects.toThrow();
});
it('preserves subscription before/after snapshots and exports only the authorized tenant history',async()=>{
 const {tenant}=await fixture();await user(operator);await rpc('platform_set_subscription',[tenant,JSON.stringify({version:1,state:'cancelled',period_end:new Date(Date.now()+86400000).toISOString(),cancel_at_period_end:false,reason:'Synthetic history check'})]);await user(owner);const exported=await rpc<any>('export_tenant_foundation',[tenant]);expect(exported.subscription_history).toHaveLength(2);expect(exported.subscription_history[1].before.state).toBe('trialing');expect(exported.subscription_history[1].after.state).toBe('cancelled');expect(exported.subscription_history[0].after.plan_snapshot.price_cents).toBe(12000);
});
it('rejects fractional cents instead of rounding a submitted plan price',async()=>{await user(operator);await expect(rpc('platform_create_plan',[JSON.stringify({...planInput,price_cents:12000.5})])).rejects.toThrow()});
