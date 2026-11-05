import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const origin=process.env.CRM_ESTETICA_QA_ORIGIN??'http://127.0.0.1:3220';
if(!/^http:\/\/127\.0\.0\.1:3220$|^https:\/\/crm-estetica-test(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin))throw Error('Only the named test site or local app is allowed');
const ref='lxzyybcvmlooiyvxmosp',url=`https://${ref}.supabase.co`;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,process.env.CRM_ESTETICA_QA_SERVICE_KEY,options);
const sdk=()=>createClient(url,process.env.CRM_ESTETICA_PUBLIC_KEY,options);
const run=randomUUID().replaceAll('-','').slice(0,16),users=[],tenants=[],checks=[];
const report={origin,run,checkedAt:new Date().toISOString(),checks,cleanup:false};
const resultDir=resolve('../docs/qa-no-email');mkdirSync(resultDir,{recursive:true});
const ok=(r,name)=>{if(r.error)throw Error(`${name}: ${r.error.code??r.error.status}`);return r.data};
async function fixture(label){const email=`qa-${run}-${label}@example.test`,password=`Qa!${randomUUID()}9`;const d=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}), 'test provisioning');users.push(d.user.id);const client=sdk();ok(await client.auth.signInWithPassword({email,password}),'login');return {email,password,id:d.user.id,client}}
try{
 const a=await fixture('owner'),b=await fixture('member');
 assert((await sdk().auth.signUp({email:`qa-${run}-blocked@example.test`,password:`Qa!${randomUUID()}9`})).error,'public signup must be disabled');
 checks.push('manual test provisioning, actual password login and server-side public signup disabled');
 const require=createRequire(import.meta.url);const {chromium}=require('../../../node_modules/playwright');
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});
   const errors=[],mailCalls=[];page.on('pageerror',e=>errors.push(e.name));
   page.on('request',r=>{if(/\/auth\/v1\/(recover|signup|resend|invite|otp)/.test(r.url()))mailCalls.push('email operation')});
   await page.goto(origin+'/auth/callback');
   await page.getByRole('heading',{name:'Entrar',exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Recuperar senha',exact:true}).count(),0);
   assert.equal(await page.getByRole('button',{name:'Criar conta',exact:true}).count(),0);
   await page.getByText('Ambiente de teste sem envio de e-mails.',{exact:false}).waitFor();
   await page.getByLabel('E-mail',{exact:true}).fill(a.email);await page.getByLabel('Senha',{exact:true}).fill(a.password);
   await page.getByRole('button',{name:'Entrar',exact:true}).click();
   const name=`QA ${run} UI-${width}`;
   if(width===390){
    await page.getByLabel('Nome do estabelecimento',{exact:true}).fill(name);await page.getByLabel('Primeira unidade',{exact:true}).fill('Unidade QA');
    await page.getByRole('button',{name:'Criar estabelecimento',exact:true}).click();
    await page.getByText('A sua agenda começa aqui',{exact:true}).waitFor();
    const rows=ok(await a.client.from('tenants').select('id').eq('name',name),'persisted onboarding');assert.equal(rows.length,1);tenants.push(rows[0].id);
    assert.equal(ok(await b.client.from('tenants').select('id').eq('id',rows[0].id),'tenant isolation').length,0);
   }else await page.getByText('A sua agenda começa aqui',{exact:true}).waitFor();
   if(width<1024)await page.getByRole('button',{name:'Menu',exact:true}).click();
   await page.getByRole('button',{name:'Configurações',exact:true}).click();
   await page.getByRole('button',{name:'Convites',exact:true}).click();
   await page.getByLabel('E-mail do membro',{exact:true}).fill(b.email);
   await page.getByRole('button',{name:'Criar convite · 48 h',exact:true}).click();
   await page.getByText('Convite criado.',{exact:false}).waitFor();
   const token=await page.getByRole('textbox',{name:'Código privado · apresentado uma vez'}).inputValue();
   ok(await b.client.rpc('accept_member_invitation',{p_token:token}),'member acceptance');
   assert((await b.client.rpc('accept_member_invitation',{p_token:token})).error);
   assert((await b.client.rpc('create_member_invitation',{p_tenant:tenants[0],p_email:a.email,p_role:'owner'})).error);
   await page.getByRole('button',{name:'Fechar',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:join(resultDir,`${origin.startsWith('http:')?'local':'vercel'}-${width}.png`),fullPage:true});
   await page.getByRole('button',{name:'Sair',exact:true}).click();await page.getByRole('heading',{name:'Entrar',exact:true}).waitFor();
   await page.goto(origin+'/auth/reset');
   await page.getByText('A recuperação por e-mail está desativada',{exact:false}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Salvar',exact:true}).count(),0);
   assert.equal(mailCalls.length,0);assert.equal(errors.length,0);
   checks.push(`${width}px: login, persisted onboarding/tenant, invitation, authorization, logout, direct recovery blocked; zero email calls or JS errors`);
   await context.close();
  }
 }finally{await browser.close()}
}catch(e){report.failure={name:e.name,step:String(e.message).replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,250)};process.exitCode=1}
finally{
 try{
  if(tenants.length){const ids=tenants.map(x=>{assert.match(x,/^[0-9a-f-]{36}$/);return `'${x}'`}).join(',');const file=resolve('../.local/qa-no-email-cleanup.sql');writeFileSync(file,`begin;delete from public.member_invitations where tenant_id in (${ids});delete from public.audit_events where tenant_id in (${ids});delete from public.units where tenant_id in (${ids});delete from public.memberships where tenant_id in (${ids});delete from public.tenants where id in (${ids}) and name like 'QA ${run} %';commit;`);execFileSync(process.execPath,[join(process.env.APPDATA,'npm/node_modules/supabase/dist/supabase.js'),'db','query','--linked','--project-ref',ref,'--file',file,'--output','json'],{cwd:resolve('..'),stdio:['ignore','pipe','pipe']})}
  for(const id of users)ok(await admin.auth.admin.deleteUser(id),'fixture cleanup');report.cleanup=true;
 }catch{report.cleanup=false;process.exitCode=1}
 writeFileSync(join(resultDir,`${origin.startsWith('http:')?'local':'vercel'}-results.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
