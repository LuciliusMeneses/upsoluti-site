import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
const ref='lxzyybcvmlooiyvxmosp',url=`https://${ref}.supabase.co`;
const values=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith('VITE_')&&x.includes('=')).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1).replace(/^"|"$/g,'')]}));
if(values.VITE_SUPABASE_URL!==url)throw Error('Unexpected project');
const create=()=>createClient(url,values.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const platform=create(),owner=create();
const operator=JSON.parse(readFileSync(resolve('../.local/platform-access.json'),'utf8'));
const accountFile=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8'));
const account=accountFile.accounts.find(a=>a.email==='admin@crm-estetica.test');
if(operator.project!==ref||accountFile.project!==ref||!account)throw Error('Unexpected test accounts');
const ok=(result,label)=>{if(result.error)throw Error(`${label}: ${result.error.code??result.error.status}`);return result.data};
const call=async(client,name,args={})=>ok(await client.rpc(name,args),name);
try{
 ok(await platform.auth.signInWithPassword({email:operator.email,password:operator.password}),'platform login');
 if(!await call(platform,'platform_access'))throw Error('Platform role required');
 const data=await call(platform,'platform_overview');
 let plan=data.plans.filter(p=>p.code==='teste-guiado-sem-cobranca').sort((a,b)=>b.revision-a.revision)[0];
 if(!plan){const id=await call(platform,'platform_create_plan',{p_input:{code:'teste-guiado-sem-cobranca',name:'Teste — sem cobrança',price_cents:0,currency:'BRL',interval_months:1,trial_days:30,grace_days:0,max_units:1,max_professionals:10,max_members:5,features:['settings','team'],published:true}});plan=(await call(platform,'platform_overview')).plans.find(p=>p.id===id)}
 if(!plan.published)await call(platform,'platform_publish_plan',{p_plan:plan.id,p_published:true});
 ok(await owner.auth.signInWithPassword({email:account.email,password:account.password}),'establishment login');
 const memberships=ok(await owner.from('memberships').select('tenant_id,role,tenants(id,name)').eq('active',true),'own memberships');
 let selected=memberships.find(m=>m.role==='owner'&&m.tenants?.name==='Estética Demonstração');
 let tenant=selected?.tenant_id;
 const provisionPath=resolve('../.local/guided-demo-provision.json');
 if(!tenant){
  let request;if(readFileSyncSafe(provisionPath))request=JSON.parse(readFileSync(provisionPath,'utf8'));else{request={project:ref,request_id:randomUUID()};writeFileSync(provisionPath,JSON.stringify(request))}
  if(request.project!==ref)throw Error('Unexpected provision request');
  tenant=await call(owner,'create_establishment',{p_input:{request_id:request.request_id,plan_id:plan.id,name:'Estética Demonstração',unit:'Unidade de Testes',locale:'pt-BR',country:'BR',currency:'BRL',timezone:'America/Sao_Paulo'}});
 }
 let subscription=await call(owner,'tenant_subscription',{p_tenant:tenant});
 if(subscription.plan_id!==plan.id||!subscription.writable){await call(platform,'platform_set_subscription',{p_tenant:tenant,p_input:{version:subscription.version,plan_id:plan.id,state:'trialing',period_end:new Date(Date.now()+30*86400000).toISOString(),cancel_at_period_end:false,reason:'Ambiente demonstrativo sem cobrança solicitado pelo proprietário para testar a contratação'}});subscription=await call(owner,'tenant_subscription',{p_tenant:tenant})}
 const visible=await call(owner,'public_plan_catalog');if(!visible.some(p=>p.id===plan.id))throw Error('Published plan not visible');
 const result={project:ref,plan:{id:plan.id,name:plan.name,price_cents:plan.price_cents,currency:plan.currency,published:true,max_units:plan.max_units,max_members:plan.max_members,trial_days:plan.trial_days},establishment:{id:tenant,name:'Estética Demonstração',unit:'Unidade de Testes',owner:account.email},subscription:{state:subscription.effective_state,writable:subscription.writable,period_end:subscription.period_end},emailsSent:false,paymentCharged:false};
 writeFileSync(resolve('../.local/guided-demo-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await platform.auth.signOut();await owner.auth.signOut()}
function readFileSyncSafe(path){try{return readFileSync(path,'utf8')}catch(e){if(e.code==='ENOENT')return null;throw e}}
