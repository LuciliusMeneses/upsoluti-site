// Real local PostgreSQL/handler/browser; Auth and Supabase transport are synthetic.
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createCompanyHandler} from '../server/company-handler.mjs';
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist'),out=resolve(root,'../docs/qa-manual-local');
const operator='00000000-0000-0000-0000-000000000010',owner='00000000-0000-0000-0000-000000000011';
const db=new PGlite(),report={scope:'Isolated PGlite and real Node handler/Chromium; Auth and Supabase transport simulated; no remote data or deployment',checks:[]};
let server,browser,queue=Promise.resolve(),authCreates=0,loseFinish=false;
const serial=fn=>{const r=queue.then(fn);queue=r.catch(()=>{});return r};
async function asOperator(){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[operator]);await db.exec('set role authenticated')}
async function rpc(name,args={}){await asOperator();const values=Object.values(args);return (await db.query(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values)).rows[0].result}
const jwt=[{alg:'HS256',typ:'JWT'},{sub:operator,exp:Math.floor(Date.now()/1000)+3600},'synthetic'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
const authUser={id:operator,email:'operator@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
const password='Synthetic!Only123';
try{
 mkdirSync(out,{recursive:true});
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table storage.buckets(id text primary key,name text,public boolean);`);
 for(const [id,email] of [[operator,'operator@example.test'],[owner,'owner@example.test']])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
 for(const name of ['001_foundation.sql','002_invitations.sql','003_strict_foundation_input.sql','004_commercial.sql','005_subscription_history.sql','006_operations.sql','007_business.sql','008_public_pages.sql','009_manual_companies.sql','010_manual_company_conflict.sql'])await db.exec(readFileSync(resolve(root,'../supabase/migrations',name),'utf8'));
 await db.query('insert into private.platform_operators(user_id) values($1)',[operator]);
 const plan=await rpc('platform_create_plan',{p_input:JSON.stringify({code:'qa-manual',name:'QA Manual',price_cents:0,currency:'BRL',interval_months:1,trial_days:30,grace_days:0,max_units:1,max_members:3,max_professionals:3,features:['settings','team'],published:true})});
 const env={CRM_PUBLIC_ORIGIN:'',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server-secret'};
 const handler=createCompanyHandler({env,makeClient:()=>({
  auth:{getUser:async token=>({data:{user:token===jwt?authUser:null},error:token===jwt?null:{}}),admin:{createUser:async input=>serial(async()=>{await db.exec('reset role');const id=crypto.randomUUID();await db.query('insert into auth.users values($1,$2,now(),$3)',[id,input.email,JSON.stringify(input.app_metadata)]);authCreates++;return {data:{user:{id}},error:null}})}},
  rpc:async(name,args)=>serial(async()=>{try{const data=await rpc(name,Object.fromEntries(Object.entries(args??{}).map(([k,v])=>[k,v&&typeof v==='object'?JSON.stringify(v):v])));if(name==='platform_finish_company'&&loseFinish){loseFinish=false;return {data:null,error:{code:'XX000'}}}return {data,error:null}}catch(e){return {data:null,error:{code:e.code}}}})
 })});
 server=createServer((req,res)=>{if(req.url==='/api/platform/company'){void handler(req,res);return}const file=resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403).end();return}try{const target=extname(file)?file:resolve(dist,'index.html');res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(target)]??'application/octet-stream'});res.end(readFileSync(target))}catch{res.writeHead(404).end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;env.CRM_PUBLIC_ORIGIN=origin;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({session})=>localStorage.setItem('sb-lxzyybcvmlooiyvxmosp-auth-token',JSON.stringify(session)),{session:{access_token:jwt,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:authUser}});
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin===origin)return route.continue();if(url.pathname==='/auth/v1/user')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(authUser)});const name=url.pathname.split('/rest/v1/rpc/')[1];if(['platform_access','platform_overview'].includes(name)){const data=await serial(()=>rpc(name));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})}if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.abort();external.push(url.origin+url.pathname);return route.abort()});
 page.on('dialog',dialog=>dialog.accept());
 await page.goto(origin+'/platform');await page.getByRole('heading',{name:'Visão geral da plataforma',exact:true}).waitFor();await page.getByRole('button',{name:'Empresas e assinaturas',exact:true}).click();
 async function open(){await page.getByRole('button',{name:'Nova empresa',exact:true}).click();await page.getByRole('dialog').waitFor()}
 async function fill(name,mode,email){const dialog=page.getByRole('dialog');await dialog.getByLabel('Nome da empresa',{exact:true}).fill(name);await dialog.getByLabel('Primeira unidade',{exact:true}).fill('Unidade local QA');await dialog.locator('select[name="plan_id"]').selectOption(plan);await dialog.locator('select[name="owner_mode"]').selectOption(mode);await dialog.getByLabel('E-mail do proprietário',{exact:true}).fill(email);if(mode==='new')await dialog.getByLabel('Senha inicial do proprietário',{exact:true}).fill(password)}
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await open();await fill('Empresa local QA','new','new@example.test');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);await page.getByRole('dialog').evaluate(el=>el.scrollTo(0,0));await page.screenshot({path:resolve(out,`new-${width}.png`),fullPage:true});await page.getByRole('button',{name:'Fechar formulário',exact:true}).click()}
 report.checks.push('New company form at 320/390/768/1440 without page or dialog overflow');
 await open();await fill('Empresa vinculada QA','existing','missing@example.test');await page.getByRole('button',{name:'Cadastrar empresa',exact:true}).click();await page.getByRole('alert').filter({hasText:'não foi encontrada'}).waitFor();await page.getByLabel('E-mail do proprietário',{exact:true}).fill('owner@example.test');await page.getByRole('button',{name:'Cadastrar empresa',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('heading',{name:'Empresa vinculada QA',exact:true}).waitFor();assert.equal(authCreates,0);
 report.checks.push('Missing existing owner gives recoverable feedback; corrected existing account provision creates company without Auth account/password mutation');
 await open();await fill('Empresa nova QA','new','new@example.test');loseFinish=true;await page.getByRole('button',{name:'Cadastrar empresa',exact:true}).click();await page.getByRole('alert').filter({hasText:'Não foi possível confirmar'}).waitFor();assert.equal(authCreates,1);await page.getByRole('button',{name:'Cadastrar empresa',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('heading',{name:'Empresa nova QA',exact:true}).waitFor();assert.equal(authCreates,1);
 await page.reload();await page.getByRole('button',{name:'Empresas e assinaturas',exact:true}).click();await page.getByRole('heading',{name:'Empresa nova QA',exact:true}).waitFor();
 await serial(async()=>{await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from public.tenants')).rows[0].n,2);assert.equal((await db.query('select count(*)::int n from public.memberships where user_id=$1',[operator])).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from public.units')).rows[0].n,2);assert.equal((await db.query('select count(*)::int n from public.saas_subscriptions')).rows[0].n,2);const ledger=(await db.query('select payload from private.company_provision_requests')).rows;assert(!JSON.stringify(ledger).includes(password))});
 report.checks.push('New owner and tenant resume safely after simulated response loss following committed transaction; retry and reload preserve exactly two companies; operator has no membership; business ledger contains no password');
 await page.getByRole('combobox',{name:'Idioma da plataforma'}).selectOption('pt-PT');await open();await page.getByRole('button',{name:'Registar empresa',exact:true}).waitFor();await page.screenshot({path:resolve(out,'pt-PT-1440.png'),fullPage:true});await page.getByRole('button',{name:'Fechar formulário',exact:true}).click();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report.checks.push('PT-PT action verified; zero JavaScript errors or unexpected external requests');
 writeFileSync(resolve(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await db.close()}
