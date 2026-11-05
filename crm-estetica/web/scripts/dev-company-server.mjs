import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createCompanyHandler} from '../server/company-handler.mjs';
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s.startsWith('VITE_')&&s.includes('='))){const i=line.indexOf('=');process.env[line.slice(0,i)]=line.slice(i+1).replace(/^"|"$/g,'')}
if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Configure SUPABASE_SERVICE_ROLE_KEY somente no processo do servidor local. Nunca use prefixo VITE.');
const handler=createCompanyHandler({env:{...process.env,CRM_PUBLIC_ORIGIN:'http://127.0.0.1:3220'}});
createServer((req,res)=>{if(req.url!=='/api/platform/company'){res.statusCode=404;res.end();return}void handler(req,res)}).listen(3223,'127.0.0.1',()=>console.log('Local platform endpoint listening on 127.0.0.1:3223'));
