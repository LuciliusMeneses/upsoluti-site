import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
import {createClient} from '@supabase/supabase-js';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validateBooking(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['slug','request_id','name','email','phone','service_id','professional_id','starts_at','consent','website'].includes(k)))return false;
 for(const k of ['slug','request_id','name','email','phone','service_id','professional_id','starts_at'])if(typeof value[k]!=='string')return false;
 return /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(value.slug)&&uuid.test(value.request_id)&&uuid.test(value.service_id)&&uuid.test(value.professional_id)&&value.name.trim().length>=2&&value.name.length<=120&&value.email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)&&value.phone.length<=40&&/^[0-9+() .-]+$/.test(value.phone)&&value.phone.replace(/\D/g,'').length>=7&&value.phone.replace(/\D/g,'').length<=18&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,6})?)?(Z|[+-]\d\d:\d\d)$/.test(value.starts_at)&&Number.isFinite(Date.parse(value.starts_at))&&value.consent===true&&(!('website'in value)||value.website==='');
}
export function createBookingHandler({env=process.env,makeClient=createClient}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'method_not_allowed'})}
  if(!env.CRM_BOOKING_GATEWAY_KEY||!env.CRM_PUBLIC_ORIGIN||!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_PUBLISHABLE_KEY)return send(503,{error:'temporarily_unavailable'});
  if(req.headers.origin!==env.CRM_PUBLIC_ORIGIN)return send(403,{error:'origin_not_allowed'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return send(415,{error:'invalid_input'});
  // Only Vercel's platform-provided IP header is trusted in deployment. Loopback dev uses the socket.
  const rawIp=env.VERCEL==='1'?req.headers['x-vercel-forwarded-for']:req.socket?.remoteAddress;
  if(typeof rawIp!=='string'||!isIP(rawIp.trim()))return send(503,{error:'temporarily_unavailable'});
  let body=req.body;
  try{
   if(Number(req.headers['content-length']??0)>8192)return send(413,{error:'invalid_input'});
   if(body===undefined){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8192)return send(413,{error:'invalid_input'});chunks.push(chunk)}body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}
   else if(typeof body==='string')body=JSON.parse(body);
   if(Buffer.byteLength(JSON.stringify(body))>8192||!validateBooking(body))return send(400,{error:'invalid_input'});
  }catch{return send(400,{error:'invalid_input'})}
  const {slug,request_id,website:_,...input}=body;
  const ipHash=createHmac('sha256',env.CRM_BOOKING_GATEWAY_KEY).update(rawIp.trim()).digest('hex');
  try{
   const client=makeClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error}=await client.rpc('submit_online_booking',{p_key:env.CRM_BOOKING_GATEWAY_KEY,p_slug:slug,p_request:request_id,p_input:input,p_ip_hash:ipHash});
   if(error)return send(503,{error:'temporarily_unavailable'});
   if(data?.error){const statuses=new Map([['invalid_input',400],['unavailable',404],['slot_unavailable',409],['request_reused',409],['rate_limited',429]]);const status=statuses.get(data.error);if(!status)return send(503,{error:'temporarily_unavailable'});if(status===429)res.setHeader('Retry-After','900');return send(status,{error:data.error})}
   if(!data?.reference)return send(503,{error:'temporarily_unavailable'});
   return send(200,data);
  }catch{return send(503,{error:'temporarily_unavailable'})}
 }
}
