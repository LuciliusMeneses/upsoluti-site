import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const origin='https://crm-estetica-test.vercel.app',ref='lxzyybcvmlooiyvxmosp',url=`https://${ref}.supabase.co`;
const opts={auth:{persistSession:false,autoRefreshToken:false}},sdk=()=>createClient(url,process.env.CRM_ESTETICA_PUBLIC_KEY,opts),admin=createClient(url,process.env.CRM_ESTETICA_QA_SERVICE_KEY,opts);
const operator=JSON.parse(readFileSync(resolve('../.local/platform-access.json'),'utf8'));if(operator.project!==ref)throw Error('Unexpected project');
const run=randomUUID().replaceAll('-','').slice(0,14),slug='qa-public-'+run,dir=resolve('../docs/qa-public-online'),checks=[],users=[],plans=[];
mkdirSync(dir,{recursive:true});
const report={origin,run,checkedAt:new Date().toISOString(),checks,cleanup:false};
const ok=(r,label)=>{if(r.error)throw Error(label+': '+r.error.code);return r.data};
const call=async(c,name,args={})=>ok(await c.rpc(name,args),name);
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
let browser,ownerPage,tenant;
async function fixture(kind){const email=`qa-public-${run}-${kind}@example.test`,password='Qa!'+randomUUID()+'9';const r=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create fixture');users.push(r.user.id);const client=sdk();ok(await client.auth.signInWithPassword({email,password}),'fixture login');return {email,password,client}}
try{
 const owner=await fixture('owner'),outside=await fixture('outside'),platform=sdk(),anonymous=sdk();
 ok(await platform.auth.signInWithPassword({email:operator.email,password:operator.password}),'operator login');
 const fullFeatures=['settings','team','catalog','clients','appointments','public_page','online_booking'];
 const planInput={code:'qa-public-'+run,name:'QA public '+run,price_cents:0,currency:'EUR',interval_months:1,trial_days:30,grace_days:0,max_units:1,max_professionals:2,max_members:3,features:fullFeatures,published:true};
 const fullPlan=await call(platform,'platform_create_plan',{p_input:planInput});plans.push(fullPlan);
 const presentationPlan=await call(platform,'platform_create_plan',{p_input:{...planInput,features:['settings','team','catalog','clients','appointments','public_page']}});plans.push(presentationPlan);
 tenant=await call(owner.client,'create_establishment',{p_input:{request_id:randomUUID(),plan_id:fullPlan,name:'QA public '+run,unit:'QA public unit',locale:'pt-BR',country:'PT',currency:'EUR',timezone:'Europe/Lisbon'}});
 const unit=ok(await owner.client.from('units').select('id').eq('tenant_id',tenant),'unit')[0].id;
 const save=(kind,input)=>call(owner.client,'save_operation_record',{p_tenant:tenant,p_kind:kind,p_input:input});
 const service=await save('service',{name:'QA public treatment',category:'QA',duration_minutes:30,preparation_minutes:15,price_cents:6500,active:true});
 const professional=await save('professional',{name:'QA public professional',unit_id:unit,service_ids:[service],active:true});
 const client=await save('client',{name:'Existing QA contact',email:'qa-public@example.test',phone:'0000000000',communication:'none',notes:'Private QA note',active:true});
 for(let weekday=0;weekday<7;weekday++)for(const professional_id of [null,professional])await save('hours',{unit_id:unit,professional_id,weekday,start_time:'09:00',end_time:'18:00'});
 browser=await chromium.launch({headless:true});
 const ownerContext=await browser.newContext({viewport:{width:1440,height:1050}}),publicContext=await browser.newContext({viewport:{width:390,height:1050}});
 ownerPage=await ownerContext.newPage();const page=await publicContext.newPage(),errors=[],emailCalls=[];
 for(const p of [ownerPage,page]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/\/auth\/v1\/(signup|recover|resend|invite|otp)/.test(r.url()))emailCalls.push('email')});await p.emulateMedia({reducedMotion:'reduce'})}
 await ownerPage.goto(origin+'/app');await ownerPage.getByLabel('E-mail',{exact:true}).fill(owner.email);await ownerPage.getByLabel('Senha',{exact:true}).fill(owner.password);await ownerPage.getByRole('button',{name:'Entrar',exact:true}).click();await ownerPage.getByRole('heading',{name:'Agenda e agendamentos'}).waitFor();
 await ownerPage.locator('.sidebar nav').getByRole('button',{name:'Configurações',exact:true}).click();
 const editor=ownerPage.locator('.tenant-public-page');await editor.getByRole('heading',{name:'Página pública e marcações online'}).waitFor();
 await editor.getByLabel('Endereço da página',{exact:true}).fill(slug);await editor.getByLabel('Nome público',{exact:true}).fill('QA public clinic '+run);await editor.getByLabel('Apresentação',{exact:true}).fill('Página sintética temporária para validar as reservas online.');
 await editor.locator('fieldset').filter({has:ownerPage.locator('legend',{hasText:'Serviços publicados'})}).getByLabel('QA public treatment',{exact:true}).check();
 await editor.locator('fieldset').filter({has:ownerPage.locator('legend',{hasText:'Profissionais publicados'})}).getByLabel('QA public professional',{exact:true}).check();
 await editor.getByLabel('Habilitar marcações online',{exact:true}).check();await editor.getByLabel('Publicar página',{exact:true}).check();await editor.getByRole('button',{name:'Salvar página',exact:true}).click();
 await ownerPage.waitForFunction(()=>document.querySelector('.clinic-owner-link a'));
 let config=ok(await owner.client.from('tenant_pages').select('*').eq('tenant_id',tenant).single(),'saved page');assert.equal(config.published,true);assert.equal(config.slug_locked,true);
 for(const width of [320,390,768,1440]){await ownerPage.setViewportSize({width,height:1050});assert.equal(await ownerPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'editor overflow '+width);await ownerPage.screenshot({path:join(dir,`editor-${width}.png`),fullPage:true})}
 checks.push('Authenticated owner publishes selected catalogue/professional through UI; slug locked; editor at four widths');
 const outsideData=ok(await outside.client.from('tenant_pages').select('tenant_id').eq('tenant_id',tenant),'outside page');assert.equal(outsideData.length,0);assert((await outside.client.rpc('save_tenant_page',{p_tenant:tenant,p_input:config})).error);
 assert.equal(ok(await platform.from('clients').select('id').eq('tenant_id',tenant),'platform isolation').length,0);
 const published=await call(anonymous,'public_clinic_page',{p_slug:slug});assert.equal(published.services.length,1);assert.equal(published.tenant_id,undefined);assert.equal(published.professionals[0].user_id,undefined);
 const date=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1050});await page.goto(origin+'/clinica/'+slug);await page.getByRole('heading',{name:'QA public clinic '+run,exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'public overflow '+width);await page.screenshot({path:join(dir,`public-${width}.png`),fullPage:true})}
 await page.setViewportSize({width:390,height:1050});await page.getByRole('combobox',{name:'Serviço da reserva'}).selectOption(service);await page.getByRole('combobox',{name:'Profissional da reserva'}).selectOption(professional);await page.getByLabel('Data da reserva',{exact:true}).fill(date);await page.waitForFunction(()=>document.querySelector('[aria-label="Horário da reserva"]')?.options.length>1);
 const start=await page.getByRole('combobox',{name:'Horário da reserva'}).locator('option').nth(1).getAttribute('value');await page.getByRole('combobox',{name:'Horário da reserva'}).selectOption(start);await page.getByLabel('Seu nome',{exact:true}).fill('QA public visitor');await page.getByLabel('E-mail para contato',{exact:true}).fill('qa-public@example.test');await page.getByLabel('Telefone para contato',{exact:true}).fill('0000000000');await page.getByRole('checkbox').check();
 const sent=page.waitForRequest(r=>r.url()===origin+'/api/booking'&&r.method()==='POST');await page.getByRole('button',{name:'Confirmar agendamento'}).click();const original=(await sent).postDataJSON();await page.getByRole('heading',{name:'Reserva registrada'}).waitFor();const reference=await page.getByLabel('Referência da reserva').inputValue();assert.match(reference,/^[a-f0-9-]{36}$/);
 async function post(body,headers={}){return page.evaluate(async({body,headers})=>{const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),retry:r.headers.get('retry-after')}},{body,headers})}
 const replay=await post(original);assert.equal(replay.status,200);assert.equal(replay.data.reference,reference);assert.equal((await post({...original,name:'Changed QA contact'})).status,409);
 const records=ok(await owner.client.from('appointments').select('*').eq('tenant_id',tenant),'online appointment');assert.equal(records.length,1);assert.equal(records[0].booking_source,'online');assert.equal(records[0].created_by,null);assert.equal(records[0].price_cents,6500);
 assert.equal(ok(await owner.client.from('clients').select('id').eq('tenant_id',tenant),'clients').length,2);
 const history=ok(await owner.client.from('appointment_events').select('*').eq('tenant_id',tenant),'history');assert.equal(history[0].actor_kind,'public');assert.equal(history[0].actor_id,null);
 await page.getByRole('combobox',{name:'Idioma da página'}).selectOption('pt-PT');await page.getByRole('button',{name:'Guardar comprovativo'}).waitFor();for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1050});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'receipt overflow '+width);await page.screenshot({path:join(dir,`receipt-${width}.png`),fullPage:true})}
 checks.push('Real Vercel gateway UI booking persisted with snapshot, public author/history and opaque receipt; retry idempotent; changed retry rejected; unverified contacts not merged; PT-PT receipt/four widths');
 const slots=await call(anonymous,'public_clinic_slots',{p_slug:slug,p_professional:professional,p_service:service,p_date:date});
 const payload=(starts_at,email)=>({...original,request_id:randomUUID(),starts_at,email});
 const raceStart=slots[Math.floor(slots.length/2)].starts_at;
 const race=await Promise.all([post(payload(raceStart,'race@example.test')),owner.client.rpc('mutate_appointment',{p_tenant:tenant,p_request:randomUUID(),p_input:{action:'create',client_id:client,service_id:service,professional_id:professional,starts_at:raceStart}})]);
 assert.equal(Number(race[0].status===200)+Number(!race[1].error),1);
 assert.equal(ok(await owner.client.from('appointments').select('id').eq('tenant_id',tenant).eq('starts_at',raceStart),'race rows').length,1);
 const refreshed=await call(anonymous,'public_clinic_slots',{p_slug:slug,p_professional:professional,p_service:service,p_date:date}),dualStart=refreshed.at(-1).starts_at;
 const dual=await Promise.all([post(payload(dualStart,'dual1@example.test')),post(payload(dualStart,'dual2@example.test'))]);assert.equal(dual.filter(r=>r.status===200).length,1);assert.equal(dual.filter(r=>r.status===409).length,1);
 checks.push('Real PostgreSQL concurrency: internal/public and public/public each create exactly one appointment for the contested slot');
 async function saveConfig(changes){const current=ok(await owner.client.from('tenant_pages').select('*').eq('tenant_id',tenant).single(),'read page');const input={};for(const k of ['version','slug','title','description','address','phone','email','logo_data','accent','service_ids','professional_ids','privacy_notice','published','booking_enabled','lead_minutes','window_days'])input[k]=current[k];return call(owner.client,'save_tenant_page',{p_tenant:tenant,p_input:{...input,...changes}})}
 await saveConfig({published:false});assert.equal(await call(anonymous,'public_clinic_page',{p_slug:slug}),null);assert.equal((await post(payload(refreshed[0].starts_at,'unpublished@example.test'))).status,404);await saveConfig({published:true});
 async function subscription(plan_id,state='trialing'){const s=await call(owner.client,'tenant_subscription',{p_tenant:tenant});return call(platform,'platform_set_subscription',{p_tenant:tenant,p_input:{version:s.version,state,period_end:s.period_end,cancel_at_period_end:false,reason:'QA public entitlement lifecycle',plan_id}})}
 await subscription(presentationPlan);assert.equal((await call(anonymous,'public_clinic_page',{p_slug:slug})).booking_enabled,false);assert.equal((await call(anonymous,'public_clinic_slots',{p_slug:slug,p_professional:professional,p_service:service,p_date:date})).length,0);assert.equal((await post(payload(refreshed[0].starts_at,'presentation@example.test'))).status,404);
 await subscription(fullPlan);assert.equal((await call(anonymous,'public_clinic_page',{p_slug:slug})).booking_enabled,true);
 const invalid=await page.evaluate(async()=>{const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return r.status});assert.equal(invalid,400);
 const cross=await fetch(origin+'/api/booking',{method:'POST',headers:{Origin:'https://other.example.test','Content-Type':'application/json'},body:JSON.stringify(original)});assert.equal(cross.status,403);
 let limited;for(let i=0;i<12;i++){limited=await post(payload(start,'limited@example.test'));if(limited.status===429)break}assert.equal(limited.status,429);assert.equal(limited.retry,'900');
 await subscription(fullPlan,'cancelled');assert.equal(await call(anonymous,'public_clinic_page',{p_slug:slug}),null);const exported=await call(owner.client,'export_tenant_operations',{p_tenant:tenant});assert.equal(exported.tenant_page.slug,slug);assert(exported.online_bookings.length>=2);
 assert.equal(errors.length,0,errors.join(';'));assert.equal(emailCalls.length,0);
 checks.push('Unpublish/republication, presentation-only plan independently blocks booking, restore, endpoint origin/input/rate limits, cancelled subscription suspension and retained authorized export; zero JS errors/email requests');
 await ownerContext.close();await publicContext.close();
}catch(e){if(ownerPage)await ownerPage.screenshot({path:join(dir,'failure.png'),fullPage:true}).catch(()=>{});report.failure={name:e.name,message:String(e.message).replace(/https?:\/\/\S+/g,'[URL]').slice(0,1400)};process.exitCode=1}
finally{
 await browser?.close();
 try{
  let sql='begin;';if(tenant){assert.match(tenant,/^[a-f0-9-]{36}$/);const t=`'${tenant}'`;sql+=`do $$begin if not exists(select 1 from public.tenants where id=${t} and name='QA public ${run}') then raise exception 'Fixture identity mismatch';end if;end$$;`;
   for(const table of ['private.online_requests','private.online_attempts','public.online_bookings','public.tenant_pages','private.operation_requests','public.appointment_events','public.appointments','public.schedule_blocks','public.working_hours','public.professionals','public.services','public.clients','private.provision_requests','private.unit_requests','private.platform_audit','public.saas_subscription_events','public.saas_subscriptions','public.member_invitations','public.audit_events','public.memberships','public.units']){
    if(table==='public.saas_subscription_events')continue;
    sql+=`delete from ${table} where tenant_id=${t};`;
   }sql+=`delete from public.tenants where id=${t};`;
  }
  for(const plan of plans){assert.match(plan,/^[a-f0-9-]{36}$/);sql+=`delete from private.platform_audit where details->>'plan_id'='${plan}';delete from public.saas_plans where id='${plan}' and code='qa-public-${run}';`}
  sql+='commit;';const file=resolve('../.local/qa-public-cleanup.sql');writeFileSync(file,sql);
  execFileSync(process.execPath,[join(process.env.APPDATA,'npm/node_modules/supabase/dist/supabase.js'),'db','query','--linked','--project-ref',ref,'--file',file,'--output','json'],{cwd:resolve('..'),stdio:'pipe'});
  for(const id of users)ok(await admin.auth.admin.deleteUser(id),'fixture removal');
  report.cleanup=true;
 }catch{report.cleanup=false;report.cleanupFailure='Synthetic fixture cleanup requires review; recovery SQL in ignored .local/qa-public-cleanup.sql';process.exitCode=1}
 writeFileSync(join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
