import {createClient} from '@supabase/supabase-js';
import {writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const run=process.argv[2];
if(!/^[a-f0-9]{16}$/.test(run??''))throw Error('Exact QA run ID required');
const ref='lxzyybcvmlooiyvxmosp';
const sdk=createClient(`https://${ref}.supabase.co`,process.env.CRM_ESTETICA_QA_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:tenants,error}=await sdk.from('tenants').select('id').like('name',`QA ${run} %`);
if(error)throw Error('Unable to identify QA tenants');
const projectRoot=resolve('..');
if(tenants.length){
 const ids=tenants.map(t=>{if(!/^[a-f0-9-]{36}$/.test(t.id))throw Error('Invalid fixture ID');return `'${t.id}'`}).join(',');
 const sql=`begin;delete from public.member_invitations where tenant_id in (${ids});delete from public.audit_events where tenant_id in (${ids});delete from public.units where tenant_id in (${ids});delete from public.memberships where tenant_id in (${ids});delete from public.tenants where id in (${ids}) and name like 'QA ${run} %';commit;`;
 const file=resolve(projectRoot,'.local/qa-cleanup-recovery.sql');writeFileSync(file,sql);
 execFileSync(process.execPath,[join(process.env.APPDATA,'npm/node_modules/supabase/dist/supabase.js'),'db','query','--linked','--project-ref',ref,'--file',file,'--output','json'],{cwd:projectRoot,stdio:['ignore','pipe','pipe']});
}
const {data,error:authError}=await sdk.auth.admin.listUsers({perPage:100,page:1});
if(authError)throw Error('Unable to identify QA accounts');
let removed=0;
for(const user of data.users){if(user.email?.startsWith(`qa-${run}-`)&&user.email.endsWith('@example.test')){const {error}=await sdk.auth.admin.deleteUser(user.id);if(error)throw Error('Synthetic account cleanup failed');removed++}}
console.log(JSON.stringify({run,syntheticTenantsRemoved:tenants.length,syntheticUsersRemoved:removed}));
