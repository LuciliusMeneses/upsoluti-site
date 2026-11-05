import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const ref='lxzyybcvmlooiyvxmosp';
if(!process.env.CRM_ESTETICA_QA_SERVICE_KEY)throw Error('Server credential required');
const admin=createClient(`https://${ref}.supabase.co`,process.env.CRM_ESTETICA_QA_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const file=resolve('../.local/test-access.json');
if(existsSync(file)){const existing=JSON.parse(readFileSync(file,'utf8'));if(existing.project!==ref)throw Error('Unexpected credentials file');console.log('Test credentials already prepared locally; no password rotated.');process.exit(0)}
const accounts=[];
for(const email of ['admin@crm-estetica.test','membro@crm-estetica.test']){
 const password=`Teste!${randomBytes(18).toString('base64url')}8`;
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{environment:'crm-estetica-test',purpose:'manually provisioned synthetic test account; no email verification performed'}});
 if(error)throw Error(`Test provisioning failed: ${error.code??error.status}`);
 accounts.push({email,password,userId:data.user.id});
 // Persist after each successful operation so an interruption cannot lose access.
 writeFileSync(file,JSON.stringify({project:ref,environment:'test-no-email',accounts},null,2));
}
writeFileSync(resolve('../.local/acessos-teste.txt'),[
 'CRM ESTETICA - ACESSOS EXCLUSIVOS PARA TESTE',
 'Sem envio ou verificacao real de e-mail. Nao usar dados reais.',
 'A conta admin cria um estabelecimento; a conta membro aceita um convite por codigo.',
 ...accounts.flatMap(a=>['',`Login: ${a.email}`,`Senha: ${a.password}`]),
].join('\n'));
console.log('Two test accounts provisioned without sending emails. Credentials saved only under ignored .local/.');
