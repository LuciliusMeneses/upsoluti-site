import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('runs migrations on local PostgreSQL and enforces tenant, invite and audit boundaries',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean);
 insert into auth.users values('00000000-0000-0000-0000-000000000001','owner@example.test',now()),('00000000-0000-0000-0000-000000000002','other@example.test',now()),('00000000-0000-0000-0000-000000000003','member@example.test',now());`);
 for(const name of ['001_foundation.sql','002_invitations.sql','003_strict_foundation_input.sql'])await db.exec(readFileSync(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8'));
 async function asUser(id:string){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
 const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002',member='00000000-0000-0000-0000-000000000003';
 const input={name:'Synthetic demo',unit:'Centro',locale:'pt-PT',country:'PT',currency:'EUR',timezone:'Europe/Lisbon'};
 await asUser(owner);
 const {rows}=await db.query<{id:string}>('select public.create_establishment($1::jsonb) as id',[JSON.stringify(input)]);const tenant=rows[0].id;
 expect((await db.query('select * from public.tenants')).rows).toHaveLength(1);
 await expect(db.query('insert into public.memberships values($1,$2,\'owner\',true)',[tenant,other])).rejects.toThrow();
 await expect(db.query('select public.create_establishment($1::jsonb)',[JSON.stringify({...input,tenant_id:tenant})])).rejects.toThrow();
 await expect(db.query('select public.create_establishment($1::jsonb)',[JSON.stringify({...input,name:{unexpected:true}})])).rejects.toThrow();
 await expect(db.query('delete from public.audit_events')).rejects.toThrow();
 const invitation=await db.query<{token:string}>('select public.create_member_invitation($1,$2,$3) token',[tenant,'member@example.test','reception']);
 const token=invitation.rows[0].token;expect(token).toHaveLength(64);
 await expect(db.query('select public.create_member_invitation($1,$2,$3)',[tenant,'x@example.test','owner'])).rejects.toThrow();
 await asUser(other);
 for(const table of ['tenants','units','memberships','audit_events'])expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0);
 await expect(db.query('select public.accept_member_invitation($1)',[token])).rejects.toThrow();
 await expect(db.query('select public.create_member_invitation($1,$2,$3)',[tenant,'other@example.test','manager'])).rejects.toThrow();
 await db.query('select public.create_establishment($1::jsonb)',[JSON.stringify({...input,name:'Other tenant'})]);
 expect((await db.query('select * from public.tenants')).rows).toHaveLength(1);
 await asUser(member);await db.query('select public.accept_member_invitation($1)',[token]);
 expect((await db.query<{role:string}>('select role from public.memberships')).rows[0].role).toBe('reception');
 expect((await db.query('select * from public.tenants')).rows).toHaveLength(1);
 expect((await db.query('select * from public.audit_events')).rows).toHaveLength(0);
 await expect(db.query('select public.accept_member_invitation($1)',[token])).rejects.toThrow();
 await db.exec('reset role;set role anon');
 await expect(db.query('select * from public.tenants')).rejects.toThrow();
 await expect(db.query('select public.create_establishment($1::jsonb)',[JSON.stringify(input)])).rejects.toThrow();
 }finally{await db.close()}
},30000);
