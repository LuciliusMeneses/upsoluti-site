import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const ref='lxzyybcvmlooiyvxmosp';
if(!process.env.CRM_ESTETICA_QA_SERVICE_KEY)throw Error('Server credential required');
const admin=createClient(`https://${ref}.supabase.co`,process.env.CRM_ESTETICA_QA_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const file=resolve('../.local/platform-access.json');let account;
if(existsSync(file)){account=JSON.parse(readFileSync(file,'utf8'));if(account.project!==ref)throw Error('Unexpected project');const {data,error}=await admin.auth.admin.getUserById(account.userId);if(error||data.user.user_metadata?.environment!=='platform-test')throw Error('Unexpected bootstrap identity')}
else{const email='plataforma@crm-estetica.test',password=`Plataforma!${randomBytes(18).toString('base64url')}9`;const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{environment:'platform-test',purpose:'Dedicated synthetic SaaS operator; role granted separately by server bootstrap'}});if(error)throw Error(`Bootstrap Auth failed: ${error.code}`);account={project:ref,email,password,userId:data.user.id};writeFileSync(file,JSON.stringify(account,null,2))}
if(!/^[a-f0-9-]{36}$/.test(account.userId))throw Error('Invalid bootstrap ID');
const sql=`begin;insert into private.platform_operators(user_id) values('${account.userId}') on conflict do nothing;insert into private.platform_audit(actor_id,action,reason) values('${account.userId}','operator.bootstrap','Dedicated test operator provisioned by authorized server tool');commit;`;
const sqlFile=resolve('../.local/platform-bootstrap.sql');writeFileSync(sqlFile,sql);execFileSync(process.execPath,[join(process.env.APPDATA,'npm/node_modules/supabase/dist/supabase.js'),'db','query','--linked','--project-ref',ref,'--file',sqlFile,'--output','json'],{cwd:resolve('..'),stdio:['ignore','pipe','pipe']});
writeFileSync(resolve('../.local/acessos-plataforma.txt'),['ADMINISTRACAO DA PLATAFORMA - APENAS TESTES','Vercel: https://crm-estetica-test.vercel.app/platform','Local: http://127.0.0.1:3220/platform',`Login: ${account.email}`,`Senha: ${account.password}`,'Esta conta tem papel global separado e nenhum acesso automatico a dados operacionais das empresas.'].join('\n'));
console.log('Dedicated platform test operator provisioned. Credentials written only to ignored local files.');
