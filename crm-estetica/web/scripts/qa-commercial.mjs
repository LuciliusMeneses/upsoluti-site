import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const origin=process.env.CRM_ESTETICA_QA_ORIGIN??'http://127.0.0.1:3220';
if(!/^http:\/\/127\.0\.0\.1:3220$|^https:\/\/crm-estetica-test\.vercel\.app$/.test(origin))throw Error('Unexpected test origin');
const ref='lxzyybcvmlooiyvxmosp',url=`https://${ref}.supabase.co`,opts={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,process.env.CRM_ESTETICA_QA_SERVICE_KEY,opts),sdk=()=>createClient(url,process.env.CRM_ESTETICA_PUBLIC_KEY,opts);
const operator=JSON.parse(readFileSync(resolve('../.local/platform-access.json'),'utf8'));
if(operator.project!==ref)throw Error('Unexpected platform account');
const run=randomUUID().replaceAll('-','').slice(0,14),users=[],tenantIds=[],checks=[];
const dir=resolve('../docs/qa-commercial');mkdirSync(dir,{recursive:true});
const report={origin,run,checkedAt:new Date().toISOString(),checks,cleanup:false};
const ok=(r,label)=>{if(r.error)throw Error(`${label}: ${r.error.code??r.error.status}`);return r.data};
const call=async(client,name,args={})=>ok(await client.rpc(name,args),name);
async function fixture(name){const email=`qa-${run}-${name}@example.test`,password=`Qa!${randomUUID()}9`;const r=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create fixture');users.push(r.user.id);const client=sdk();ok(await client.auth.signInWithPassword({email,password}),'fixture login');return {id:r.user.id,email,password,client}}
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
let browser;
try{
 const owner=await fixture('owner'),member=await fixture('member'),extra=await fixture('extra');const platformSdk=sdk();ok(await platformSdk.auth.signInWithPassword({email:operator.email,password:operator.password}),'platform login');
 assert.equal(await call(owner.client,'platform_access'),false);assert((await owner.client.rpc('platform_overview')).error);
 ok(await admin.auth.admin.updateUserById(extra.id,{user_metadata:{platform_admin:true}}),'metadata fixture');assert.equal(await call(extra.client,'platform_access'),false);
 checks.push('tenant owner and editable user metadata cannot grant platform privileges');
 browser=await chromium.launch({headless:true});const platformContext=await browser.newContext({viewport:{width:1440,height:1000}});const platform=await platformContext.newPage();await platform.emulateMedia({reducedMotion:'reduce'});
 const errors=[],emailCalls=[];function observe(page){page.on('pageerror',e=>errors.push(e.name));page.on('request',r=>{if(/\/auth\/v1\/(signup|recover|resend|invite|otp)/.test(r.url()))emailCalls.push('mail')})}observe(platform);
 await platform.goto(origin+'/platform');await platform.getByLabel('E-mail',{exact:true}).fill(operator.email);await platform.getByLabel('Senha',{exact:true}).fill(operator.password);await platform.getByRole('button',{name:'Entrar',exact:true}).click();
 await platform.getByRole('heading',{name:'Visão geral da plataforma'}).waitFor();
 await platform.getByRole('button',{name:'Planos e limites',exact:true}).click();await platform.getByRole('button',{name:'Novo plano',exact:true}).click();
 const planName=`QA ${run}`,code=`qa-${run}`;
 for(const [label,value] of [['Código do plano',code],['Nome do plano',planName],['Preço da assinatura','120,00'],['Avaliação (dias)','7'],['Carência por atraso (dias)','0'],['Limite de unidades','2'],['Limite de membros','2'],['Limite de profissionais ativos','3']])await platform.getByLabel(label,{exact:true}).fill(value);
 await platform.getByLabel(/^Moeda/).selectOption('EUR');await platform.getByLabel('Publicar para contratação pelas contas de teste',{exact:true}).check();await platform.getByRole('button',{name:'Salvar nova versão'}).click();
 await platform.getByRole('dialog').waitFor({state:'hidden'});await platform.getByRole('heading',{name:planName,exact:true}).waitFor();
 const plan=ok(await admin.from('saas_plans').select('*').eq('code',code),'read synthetic plan')[0];assert(plan);
 checks.push('real platform UI creates a configurable versioned published plan');
 for(const width of [320,390,768,1440]){
  await platform.setViewportSize({width,height:1000});assert.equal(await platform.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await platform.screenshot({path:join(dir,`${origin.startsWith('http:')?'local':'vercel'}-plans-${width}.png`),fullPage:true});
 }
 const ctx=await browser.newContext({viewport:{width:390,height:1000}}),page=await ctx.newPage();await page.emulateMedia({reducedMotion:'reduce'});observe(page);
 await page.goto(origin+'/app');await page.getByLabel('E-mail',{exact:true}).fill(owner.email);await page.getByLabel('Senha',{exact:true}).fill(owner.password);await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('combobox',{name:'Plano contratado',exact:true}).selectOption(plan.id);await page.getByLabel('Nome do estabelecimento',{exact:true}).fill(`QA ${run} Center`);await page.getByLabel('Primeira unidade',{exact:true}).fill('Unidade QA');await page.getByRole('button',{name:'Criar estabelecimento',exact:true}).click();await page.getByRole('heading',{name:'Agenda e agendamentos',exact:true}).waitFor();
 const tenants=ok(await owner.client.from('tenants').select('id'),'fixture tenant');assert.equal(tenants.length,1);const tenant=tenants[0].id;tenantIds.push(tenant);
 assert.equal(ok(await platformSdk.from('units').select('id').eq('tenant_id',tenant),'platform operational isolation').length,0);
 let state=await call(owner.client,'tenant_subscription',{p_tenant:tenant});assert.equal(state.effective_state,'trialing');assert.equal(state.plan_snapshot.currency,'EUR');
 const concurrent=await Promise.all(['A','B'].map(name=>owner.client.rpc('create_tenant_unit',{p_tenant:tenant,p_request:randomUUID(),p_name:'Concurrent '+name})));assert.equal(concurrent.filter(r=>!r.error).length,1);assert.equal(concurrent.filter(r=>r.error?.code==='23514').length,1);
 const tokens=await Promise.all([member,extra].map(user=>call(owner.client,'create_member_invitation',{p_tenant:tenant,p_email:user.email,p_role:'professional'})));
 const accepts=await Promise.all([member,extra].map((user,i)=>user.client.rpc('accept_member_invitation',{p_token:tokens[i]})));assert.equal(accepts.filter(r=>!r.error).length,1);assert.equal(accepts.filter(r=>r.error?.code==='23514').length,1);
 checks.push('mobile provision persists subscription snapshot; concurrent unit and membership requests respect plan quotas');
 const secondPlan=await call(platformSdk,'platform_create_plan',{p_input:{code,name:planName,price_cents:24000,currency:'EUR',interval_months:1,trial_days:7,grace_days:0,max_units:8,max_professionals:8,max_members:8,features:['settings','team'],published:false}});
 state=await call(owner.client,'tenant_subscription',{p_tenant:tenant});assert.equal(state.plan_snapshot.price_cents,12000);assert.equal(state.plan_snapshot.max_units,2);assert.notEqual(state.plan_id,secondPlan);
 assert((await owner.client.rpc('platform_set_subscription',{p_tenant:tenant,p_input:{}})).error);
 checks.push('new plan revisions preserve contracted price/limits; tenant cannot change own commercial state');
 await platform.setViewportSize({width:1440,height:1000});await platform.getByRole('button',{name:'Empresas e assinaturas',exact:true}).click();
 let card=platform.locator('.company-card').filter({has:platform.getByRole('heading',{name:`QA ${run} Center`,exact:true})});await card.getByRole('button',{name:'Gerir assinatura'}).click();
 await platform.getByLabel(/^Estado da assinatura/).selectOption('active');const end=new Date(Date.now()+30*86400000).toISOString().slice(0,10);await platform.getByLabel('Fim do período (data UTC)',{exact:true}).fill(end);await platform.getByLabel('Motivo da alteração',{exact:true}).fill('Synthetic QA activation');await platform.getByRole('button',{name:'Atualizar assinatura',exact:true}).click();await platform.getByRole('dialog').waitFor({state:'hidden'});
 state=await call(owner.client,'tenant_subscription',{p_tenant:tenant});assert.equal(state.effective_state,'active');
 const overview=await call(platformSdk,'platform_overview');assert(overview.mrr.some(x=>x.currency==='EUR'&&Number(x.cents)>=12000));assert.equal(state.payment_received,null);
 checks.push('platform UI updates subscription with reason/version; contracted MRR is separated from cash received');
 await card.getByRole('button',{name:'Gerir assinatura'}).click();await platform.getByLabel(/^Estado da assinatura/).selectOption('cancelled');await platform.getByLabel('Motivo da alteração',{exact:true}).fill('Synthetic QA cancellation');await platform.getByRole('button',{name:'Atualizar assinatura',exact:true}).click();await platform.getByRole('dialog').waitFor({state:'hidden'});
 await page.reload();await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByText('Cancelada · leitura',{exact:true}).waitFor();assert(await page.getByRole('button',{name:'Adicionar unidade',exact:true}).isDisabled());
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar dados e histórico (JSON)',exact:true}).click();const download=await downloadPromise;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const exported=JSON.parse(Buffer.concat(chunks).toString());assert.equal(exported.tenant.id,tenant);assert.equal(exported.scope,'foundation-operations-and-business');assert.equal(exported.units.length,2);assert(exported.subscription_history.length>=3);assert(!exported.users);assert(!exported.invitations);
 assert((await owner.client.rpc('create_tenant_unit',{p_tenant:tenant,p_request:randomUUID(),p_name:'Blocked'})).error);
 await page.screenshot({path:join(dir,`${origin.startsWith('http:')?'local':'vercel'}-subscription-390.png`),fullPage:true});
 await page.goto(origin+'/platform');await page.getByRole('heading',{name:'Acesso restrito à administração do SaaS'}).waitFor();
 checks.push('cancelled tenant retains authorized export/read; writes and platform access denied');
 const publicContext=await browser.newContext({viewport:{width:320,height:900}}),site=await publicContext.newPage();observe(site);await site.goto(origin);await site.getByRole('heading',{name:'Mais cuidado com o seu negócio.',exact:false}).waitFor();assert.equal(await site.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await site.screenshot({path:join(dir,`${origin.startsWith('http:')?'local':'vercel'}-site-320.png`),fullPage:true});
 await site.getByRole('link',{name:'Explorar demonstração',exact:false}).click();await site.getByRole('heading',{name:'Agenda operacional'}).waitFor();assert.equal(errors.length,0);assert.equal(emailCalls.length,0);
 checks.push('commercial site/demo routing and four platform widths; zero email calls, JS errors or page overflow');
 await ctx.close();await publicContext.close();await platformContext.close();
}catch(e){report.failure={name:e.name,step:String(e.message).replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,450)};process.exitCode=1}
finally{
 if(browser)await browser.close();
 try{
  const rows=ok(await admin.from('tenants').select('id').like('name',`QA ${run}%`),'cleanup tenant selection');const ids=rows.map(x=>{assert.match(x.id,/^[a-f0-9-]{36}$/);return `'${x.id}'`});
  const plans=ok(await admin.from('saas_plans').select('id').eq('code',`qa-${run}`),'cleanup plan selection');const planIds=plans.map(x=>{assert.match(x.id,/^[a-f0-9-]{36}$/);return `'${x.id}'`});
  let sql='begin;';if(ids.length){const list=ids.join(',');sql+=`delete from private.provision_requests where tenant_id in (${list});delete from private.unit_requests where tenant_id in (${list});delete from private.platform_audit where tenant_id in (${list});delete from public.saas_subscriptions where tenant_id in (${list});delete from public.member_invitations where tenant_id in (${list});delete from public.audit_events where tenant_id in (${list});delete from public.memberships where tenant_id in (${list});delete from public.units where tenant_id in (${list});delete from public.tenants where id in (${list});`}
  if(planIds.length)sql+=`delete from private.platform_audit where details->>'plan_id' in (${planIds.join(',')});delete from public.saas_plans where id in (${planIds.join(',')}) and code='qa-${run}';`;sql+='commit;';
  const file=resolve('../.local/qa-commercial-cleanup.sql');writeFileSync(file,sql);execFileSync(process.execPath,[join(process.env.APPDATA,'npm/node_modules/supabase/dist/supabase.js'),'db','query','--linked','--project-ref',ref,'--file',file,'--output','json'],{cwd:resolve('..'),stdio:['ignore','pipe','pipe']});
  for(const id of users)ok(await admin.auth.admin.deleteUser(id),'fixture removal');report.cleanup=true;
 }catch{report.cleanup=false;process.exitCode=1}
 writeFileSync(join(dir,`${origin.startsWith('http:')?'local':'vercel'}-results.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
