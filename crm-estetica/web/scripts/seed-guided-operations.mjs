import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
const ref='lxzyybcvmlooiyvxmosp',tenant='e13a51a5-dc2c-4eb7-92d3-cf735373b14d';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s.startsWith('VITE_')&&s.includes('=')).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1).replace(/^"|"$/g,'')]}));
if(env.VITE_SUPABASE_URL!==`https://${ref}.supabase.co`)throw Error('Unexpected project');
const accounts=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8'));if(accounts.project!==ref)throw Error('Unexpected accounts');const account=accounts.accounts.find(a=>a.email==='admin@crm-estetica.test');
const client=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=(r,label)=>{if(r.error)throw Error(`${label}: ${r.error.code??r.error.status} ${r.error.message}`);return r.data};
const call=async(name,args)=>ok(await client.rpc(name,args),name);
const path=resolve('../.local/guided-seed-manifest.json');
const tomorrow=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T12:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
const manifest=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{project:ref,tenant,firstDate:tomorrow.toISOString().slice(0,10),requests:{}};
if(manifest.project!==ref||manifest.tenant!==tenant)throw Error('Unexpected seed manifest');
const persist=()=>writeFileSync(path,JSON.stringify(manifest,null,2));persist();
async function list(table){return ok(await client.from(table).select('*').eq('tenant_id',tenant),table)}
async function ensure(table,kind,input,match=x=>x.name===input.name){const found=(await list(table)).find(match);if(found)return found;const id=await call('save_operation_record',{p_tenant:tenant,p_kind:kind,p_input:input});return (await list(table)).find(x=>x.id===id)}
async function mutation(key,input){if(!manifest.requests[key]){manifest.requests[key]={id:randomUUID(),input};persist()}const saved=manifest.requests[key];return call('mutate_appointment',{p_tenant:tenant,p_request:saved.id,p_input:saved.input})}
try{
 ok(await client.auth.signInWithPassword({email:account.email,password:account.password}),'login');
 const memberships=ok(await client.from('memberships').select('role,tenants(name,timezone,currency)').eq('tenant_id',tenant).eq('active',true),'membership');if(!memberships.some(x=>x.role==='owner'&&x.tenants.name==='Estética Demonstração'&&x.tenants.timezone==='America/Sao_Paulo'&&x.tenants.currency==='BRL'))throw Error('Expected demo owner missing');
 const unit=(await list('units')).find(x=>x.name==='Unidade de Testes');if(!unit)throw Error('Expected unit missing');
 const serviceSpecs=[['Limpeza de pele · Teste','Facial',60,15,15000],['Depilação a laser · Teste','Depilação',30,15,12000],['Massagem relaxante · Teste','Corporal',60,15,18000],['Design de sobrancelhas · Teste','Facial',30,10,5000]];
 const services=[];for(const [name,category,duration_minutes,preparation_minutes,price_cents] of serviceSpecs)services.push(await ensure('services','service',{name,category,duration_minutes,preparation_minutes,price_cents,active:true}));
 const professionals=[];for(const [name,indexes] of [['Marina · Profissional Teste',[0,3]],['Beatriz · Profissional Teste',[1,3]],['Camila · Profissional Teste',[0,2]]])professionals.push(await ensure('professionals','professional',{name,unit_id:unit.id,service_ids:indexes.map(i=>services[i].id),user_id:null,active:true}));
 const clients=[];for(const [i,name] of ['Ana','Bruno','Carla','Daniel','Elisa','Felipe','Gabriela','Helena'].entries())clients.push(await ensure('clients','client',{name:`${name} · Cliente Teste`,email:`cliente-teste-${i+1}@example.test`,phone:'',communication:'none',notes:'Cadastro fictício para demonstração. Sem informações clínicas ou contato real.',active:true}));
 for(let weekday=0;weekday<7;weekday++)for(const professional_id of [null,...professionals.map(p=>p.id)])for(const [start_time,end_time] of [['09:00','12:00'],['13:00','18:00']])await ensure('working_hours','hours',{unit_id:unit.id,professional_id,weekday,start_time,end_time},h=>h.unit_id===unit.id&&h.professional_id===professional_id&&h.weekday===weekday&&h.start_time.slice(0,5)===start_time&&h.end_time.slice(0,5)===end_time);
 await ensure('schedule_blocks','block',{unit_id:unit.id,professional_id:professionals[1].id,starts_at:manifest.firstDate+'T14:00:00-03:00',ends_at:manifest.firstDate+'T15:00:00-03:00',reason:'Intervalo de treinamento · Teste'},b=>b.reason==='Intervalo de treinamento · Teste');
 for(let i=0;i<8;i++){
  const date=new Date(manifest.firstDate+'T12:00Z');if(i>=5)date.setUTCDate(date.getUTCDate()+1);const day=date.toISOString().slice(0,10),p=professionals[i%3],s=services.find(x=>p.service_ids.includes(x.id));
  const key=`booking-${i+1}`;let input=manifest.requests[key]?.input;
  if(!input){const slots=await call('available_appointment_slots',{p_tenant:tenant,p_professional:p.id,p_service:s.id,p_date:day});const slot=slots.find(x=>new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(new Date(x.starts_at))>=(i<3?'09':'13'));if(!slot)throw Error('No available demonstration slot');input={action:'create',client_id:clients[i].id,professional_id:p.id,service_id:s.id,starts_at:slot.starts_at}}
  const id=await mutation(key,input);
  if([0,1,5].includes(i))await mutation(`confirm-${i+1}`,{action:'confirm',id,version:1});
  if([4,7].includes(i))await mutation(`cancel-${i+1}`,{action:'cancel',id,version:1,reason:'Cancelamento fictício para testar o histórico e a liberação de vaga.'});
 }
 const bookings=await list('appointments');const report={checkedAt:new Date().toISOString(),tenantName:'Estética Demonstração',firstDate:manifest.firstDate,services:services.length,professionals:professionals.length,clients:clients.length,weeklyIntervals:(await list('working_hours')).length,blocks:(await list('schedule_blocks')).length,appointments:bookings.filter(a=>Object.values(manifest.requests).some(r=>r.input.action==='create'&&r.input.client_id===a.client_id)).length,statuses:bookings.reduce((a,b)=>({...a,[b.status]:(a[b.status]??0)+1}),{}),emailsSent:false,paymentsCreated:false};writeFileSync(resolve('../docs/qa-guided-demo/seed-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await client.auth.signOut()}
