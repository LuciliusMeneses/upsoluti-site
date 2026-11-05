import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createBookingHandler} from '../server/booking-handler.mjs';
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s.startsWith('VITE_')&&s.includes('='))){const i=line.indexOf('=');process.env[line.slice(0,i)]=line.slice(i+1).replace(/^"|"$/g,'')}
const secret=JSON.parse(readFileSync(resolve('../.local/booking-server.json'),'utf8'));if(secret.project!=='lxzyybcvmlooiyvxmosp')throw Error('Unexpected project');
const handler=createBookingHandler({env:{...process.env,VERCEL:'0',CRM_PUBLIC_ORIGIN:'http://127.0.0.1:3220',CRM_BOOKING_GATEWAY_KEY:secret.key}});
createServer((req,res)=>{if(req.url!=='/api/booking'){res.statusCode=404;res.end();return}void handler(req,res)}).listen(3221,'127.0.0.1',()=>console.log('Local booking endpoint listening on 127.0.0.1:3221'));
