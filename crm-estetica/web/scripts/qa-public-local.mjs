// Isolated browser + PostgreSQL acceptance. Never connects to the remote test database.
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {createBookingHandler} from '../server/booking-handler.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('../../../node_modules/playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'../docs/qa-public-local');
const dist=resolve(root,'dist');
const db=new PGlite();
const operator='00000000-0000-0000-0000-000000000010',owner='00000000-0000-0000-0000-000000000011';
const gatewayKey='1'.repeat(64);
let browser,server;
const results=[];
async function rpc(name,args=[]){return (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result}
async function user(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
async function anon(){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role anon')}
let queue=Promise.resolve();
function serial(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result}
try{
 mkdirSync(out,{recursive:true});
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table storage.buckets(id text primary key,name text,public boolean);`);
 for(const id of [operator,owner])await db.query('insert into auth.users values($1,$2,now())',[id,id+'@example.test']);
 for(const name of ['001_foundation.sql','002_invitations.sql','003_strict_foundation_input.sql','004_commercial.sql','005_subscription_history.sql','006_operations.sql','007_business.sql','008_public_pages.sql'])await db.exec(readFileSync(resolve(root,'../supabase/migrations',name),'utf8'));
 await db.query('insert into private.platform_operators(user_id) values($1)',[operator]);
 await db.query("insert into private.booking_gateway_config values(1,sha256(convert_to($1,'UTF8')))",[gatewayKey]);
 await user(operator);
 const plan=await rpc('platform_create_plan',[JSON.stringify({code:'qa-public',name:'QA public',price_cents:0,currency:'EUR',interval_months:1,trial_days:30,grace_days:0,max_units:1,max_members:3,max_professionals:3,features:['settings','team','catalog','appointments','clients','public_page','online_booking'],published:true})]);
 await user(owner);
 const tenant=await rpc('create_establishment',[JSON.stringify({name:'Clínica Demonstração Local',unit:'Unidade Sintética',locale:'pt-BR',country:'PT',currency:'EUR',timezone:'Europe/Lisbon',plan_id:plan,request_id:crypto.randomUUID()})]);
 const unit=(await db.query('select id from public.units where tenant_id=$1',[tenant])).rows[0].id;
 const save=(kind,input)=>rpc('save_operation_record',[tenant,kind,JSON.stringify(input)]);
 const service=await save('service',{name:'Tratamento de demonstração',category:'Estética',duration_minutes:30,preparation_minutes:15,price_cents:6500,active:true});
 const professional=await save('professional',{name:'Profissional Sintética',unit_id:unit,service_ids:[service],active:true});
 for(let weekday=0;weekday<7;weekday++)for(const professional_id of [null,professional])await save('hours',{unit_id:unit,professional_id,weekday,start_time:'09:00',end_time:'18:00'});
 const config={version:0,slug:'qa-clinic',title:'Clínica Demonstração Local',description:'Apresentação sintética para validar a página e as reservas, sem dados reais.',address:'Endereço fictício de demonstração',phone:'',email:'',logo_data:'',accent:'#0d5c58',service_ids:[service],professional_ids:[professional],privacy_notice:'Dados fictícios utilizados somente para testar esta reserva em banco local isolado.',published:true,booking_enabled:true,lead_minutes:60,window_days:30};
 await rpc('save_tenant_page',[tenant,JSON.stringify(config)]);
 await anon();
 const env={CRM_BOOKING_GATEWAY_KEY:gatewayKey,CRM_PUBLIC_ORIGIN:'',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'synthetic',VERCEL:'0'};
 const handler=createBookingHandler({env,makeClient:()=>({rpc:async(name,args)=>serial(async()=>{try{return {data:await rpc(name,Object.values(args)),error:null}}catch{return {data:null,error:{message:'local database rejected'}}}})})});
 server=createServer((req,res)=>{
  if(req.url==='/api/booking'){void handler(req,res);return}
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(dist,'.'+decodeURIComponent(pathname));
  if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403).end();return}
  try{const target=extname(file)?file:resolve(dist,'index.html');const data=readFileSync(target);const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(target)]??'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(data)}catch{res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;env.CRM_PUBLIC_ORIGIN=origin;
 browser=await chromium.launch({headless:true});
 const date=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin)return route.continue();
   const name=url.pathname.split('/rest/v1/rpc/')[1];
   if(name&&['public_clinic_page','public_clinic_slots'].includes(name)){
    const args=request.postDataJSON();
    const data=await serial(()=>name==='public_clinic_slots'?db.query('select * from public.public_clinic_slots($1,$2,$3,$4)',[args.p_slug,args.p_professional,args.p_service,args.p_date]).then(r=>r.rows):rpc(name,[args.p_slug]));
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),headers:{'Access-Control-Allow-Origin':'*'}});
   }
   if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com')return route.abort();
   external.push(url.origin+url.pathname);return route.abort();
  });
  await page.goto(origin+'/clinica/qa-clinic');
  await page.getByRole('heading',{name:config.title,exact:true}).waitFor();
  await page.getByRole('combobox',{name:'Serviço da reserva'}).selectOption(service);
  await page.getByRole('combobox',{name:'Profissional da reserva'}).selectOption(professional);
  await page.getByLabel('Data da reserva',{exact:true}).fill(date);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Horário da reserva"]')?.options.length>1);
  const slot=await page.getByRole('combobox',{name:'Horário da reserva'}).locator('option').nth(1).getAttribute('value');
  await page.getByRole('combobox',{name:'Horário da reserva'}).selectOption(slot);
  await page.getByLabel('Seu nome',{exact:true}).fill('Cliente Sintética '+width);
  await page.getByLabel('E-mail para contato',{exact:true}).fill('qa'+width+'@example.test');
  await page.getByLabel('Telefone para contato',{exact:true}).fill('0000000000');
  await page.getByRole('checkbox').check();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'form overflow '+width);
  await page.screenshot({path:resolve(out,width+'-form.png'),fullPage:true});
  await page.getByRole('button',{name:'Confirmar agendamento'}).click();
  await page.getByRole('heading',{name:'Reserva registrada'}).waitFor();
  assert.match(await page.getByLabel('Referência da reserva').inputValue(),/^[a-f0-9-]{36}$/);
  await page.screenshot({path:resolve(out,width+'-receipt.png'),fullPage:true});
  await page.getByRole('combobox',{name:'Idioma da página'}).selectOption('pt-PT');
  assert.equal(await page.locator('html').getAttribute('lang'),'pt-PT');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'receipt overflow '+width);
  await page.goto(origin+'/clinica/not-published');
  await page.getByRole('heading',{name:'Página indisponível'}).waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  results.push({width,booking:'persisted in isolated PostgreSQL',receipt:true,locale:'pt-BR/pt-PT',overflow:false,errors,unexpectedExternalRequests:external});
  await page.close();
 }
 await db.exec('reset role');
 assert.equal((await db.query('select count(*)::int n from public.appointments')).rows[0].n,4);
 assert.equal((await db.query('select count(*)::int n from public.online_bookings')).rows[0].n,4);
 writeFileSync(resolve(out,'results.json'),JSON.stringify({scope:'Local PGlite with real migrations and booking handler; Supabase transport intercepted, no remote database or deployment verified',results},null,2));
 console.log(JSON.stringify(results,null,2));
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await db.close()}
