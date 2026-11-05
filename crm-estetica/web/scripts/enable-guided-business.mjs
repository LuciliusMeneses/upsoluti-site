import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const ref='lxzyybcvmlooiyvxmosp',url=`https://${ref}.supabase.co`;
const values=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith('VITE_')&&x.includes('=')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,'')]}));if(values.VITE_SUPABASE_URL!==url)throw Error('Unexpected project');
const sdk=()=>createClient(url,values.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),platform=sdk(),owner=sdk();
const operator=JSON.parse(readFileSync(resolve('../.local/platform-access.json'),'utf8')),accounts=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8'));const account=accounts.accounts.find(a=>a.email==='admin@crm-estetica.test');if(operator.project!==ref||accounts.project!==ref||!account)throw Error('Unexpected accounts');
const ok=r=>{if(r.error)throw Error(r.error.code??'Supabase error');return r.data},call=async(c,name,args={})=>ok(await c.rpc(name,args));
try{
 ok(await platform.auth.signInWithPassword({email:operator.email,password:operator.password}));ok(await owner.auth.signInWithPassword({email:account.email,password:account.password}));
 const data=await call(platform,'platform_overview'),tenant=data.companies.find(x=>x.id==='e13a51a5-dc2c-4eb7-92d3-cf735373b14d'&&x.name==='Estética Demonstração');if(!tenant)throw Error('Expected demo missing');
 const before=await call(owner,'tenant_subscription',{p_tenant:tenant.id}),previous=data.plans.find(p=>p.id===before.plan_id);if(previous?.code!=='teste-guiado-sem-cobranca'||previous.price_cents!==0)throw Error('Unexpected demo contract');
 const features=['settings','team','catalog','clients','appointments','packages','finance','reports'];let plan=data.plans.filter(p=>p.code===previous.code&&features.every(f=>p.features.includes(f))).sort((a,b)=>b.revision-a.revision)[0];
 if(!plan){const input=Object.fromEntries(['code','name','price_cents','currency','interval_months','trial_days','grace_days','max_units','max_professionals','max_members'].map(k=>[k,previous[k]]));const next=await call(platform,'platform_create_plan',{p_input:{...input,features,published:true}});plan=(await call(platform,'platform_overview')).plans.find(p=>p.id===next)}
 if(before.plan_id!==plan.id)await call(platform,'platform_set_subscription',{p_tenant:tenant.id,p_input:{version:before.version,plan_id:plan.id,state:before.state,period_end:before.period_end,cancel_at_period_end:before.cancel_at_period_end,reason:'Habilitar pacotes, financeiro e relatórios no teste guiado autorizado, preservando preço, limites e fim da avaliação'}});
 if(!plan.published)await call(platform,'platform_publish_plan',{p_plan:plan.id,p_published:true});for(const old of data.plans.filter(p=>p.code===previous.code&&p.id!==plan.id&&p.published))await call(platform,'platform_publish_plan',{p_plan:old.id,p_published:false});
 const after=await call(owner,'tenant_subscription',{p_tenant:tenant.id});if(after.period_end!==before.period_end||after.plan_snapshot.price_cents!==0)throw Error('Demo period or price changed');
 const result={checkedAt:new Date().toISOString(),tenant:tenant.id,plan:{id:plan.id,revision:plan.revision,name:plan.name,features:plan.features,price_cents:plan.price_cents},period_end:after.period_end,professional_usage:after.professional_usage,emailsSent:false};writeFileSync(resolve('../.local/guided-business-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await platform.auth.signOut();await owner.auth.signOut()}
