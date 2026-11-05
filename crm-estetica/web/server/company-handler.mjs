import {createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const fields=['name','unit','locale','country','currency','timezone','plan_id','owner_email','owner_mode'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function companyInput(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!fields.concat('request_id','owner_password').includes(k)))return null;
 if(!uuid.test(value.request_id??'')||fields.some(k=>typeof value[k]!=='string'))return null;
 const input=Object.fromEntries(fields.map(k=>[k,value[k].trim()]));input.owner_email=input.owner_email.toLowerCase();
 if(input.name.length<2||input.name.length>100||input.unit.length<2||input.unit.length>100||!['pt-BR','pt-PT'].includes(input.locale)||!['BR','PT'].includes(input.country)||!['BRL','EUR'].includes(input.currency)||!['America/Sao_Paulo','Europe/Lisbon'].includes(input.timezone)||!uuid.test(input.plan_id)||!['new','existing'].includes(input.owner_mode)||input.owner_email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.owner_email))return null;
 if(input.owner_mode==='new'&&(typeof value.owner_password!=='string'||value.owner_password.length<12||value.owner_password.length>128))return null;
 if(input.owner_mode==='existing'&&value.owner_password!==undefined)return null;
 return input;
}
const publicErrors={P0002:[400,'owner_unavailable'],23505:[409,'owner_already_registered'],23514:[400,'account_limit'],PT409:[409,'request_reused'],40001:[409,'request_reused'],22023:[400,'invalid_input'],54000:[429,'rate_limited'],42501:[403,'forbidden']};
export function createCompanyHandler({env=process.env,makeClient=createClient}={}){
 return async function(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
  const failure=error=>{const known=Object.hasOwn(publicErrors,error?.code??'')?publicErrors[error.code]:[503,'temporarily_unavailable'];return send(known[0],{error:known[1]})};
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'method_not_allowed'})}
  if(!env.CRM_PUBLIC_ORIGIN||!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_PUBLISHABLE_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return send(503,{error:'temporarily_unavailable'});
  if(req.headers.origin!==env.CRM_PUBLIC_ORIGIN)return send(403,{error:'origin_not_allowed'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return send(415,{error:'invalid_input'});
  const token=/^Bearer (\S+)$/.exec(req.headers.authorization??'')?.[1];if(!token)return send(401,{error:'unauthorized'});
  try{
   const client=makeClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},db:{retry:false,timeout:15000},global:{headers:{Authorization:'Bearer '+token}}});
   const auth=await client.auth.getUser(token);if(auth.error||!auth.data?.user)return send(401,{error:'unauthorized'});
   const access=await client.rpc('platform_access');if(access.error)return send(503,{error:'temporarily_unavailable'});if(access.data!==true)return send(403,{error:'forbidden'});
   let value=req.body;
   try{if(Number(req.headers['content-length']??0)>8192)return send(413,{error:'invalid_input'});if(value===undefined){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8192)return send(413,{error:'invalid_input'});chunks.push(chunk)}value=JSON.parse(Buffer.concat(chunks).toString('utf8'))}else if(typeof value==='string')value=JSON.parse(value);if(Buffer.byteLength(JSON.stringify(value))>8192)return send(413,{error:'invalid_input'})}catch{return send(400,{error:'invalid_input'})}
   const input=companyInput(value);if(!input)return send(400,{error:'invalid_input'});
   const fingerprint=createHmac('sha256',env.SUPABASE_SERVICE_ROLE_KEY).update(JSON.stringify({input,password:value.owner_password??null})).digest('hex');
   const args={p_request:value.request_id,p_input:input,p_fingerprint:fingerprint};
   let prepared=await client.rpc('platform_prepare_company',args);if(prepared.error)return failure(prepared.error);
   if(prepared.data?.tenant_id)return send(200,{tenant_id:prepared.data.tenant_id});
   if(input.owner_mode==='new'&&!prepared.data?.owner_id){
    // The administrative client is created only after verified platform access and durable preparation.
    const service=makeClient(env.VITE_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const created=await service.auth.admin.createUser({email:input.owner_email,password:value.owner_password,email_confirm:true,app_metadata:{platform_provision_request:auth.data.user.id+':'+value.request_id}});
    if(created.error){
     if(created.error.code==='weak_password')return send(400,{error:'invalid_password'});
     // A timeout or concurrent retry may have created the user. Re-read the trusted request marker.
     prepared=await client.rpc('platform_prepare_company',args);
     if(prepared.error)return failure(prepared.error);
     if(prepared.data?.tenant_id)return send(200,{tenant_id:prepared.data.tenant_id});
     if(!prepared.data?.owner_id)return send(503,{error:'account_creation_incomplete'});
    }
   }
   const result=await client.rpc('platform_finish_company',{p_request:value.request_id});if(result.error)return failure(result.error);
   if(typeof result.data!=='string'||!uuid.test(result.data))return send(503,{error:'temporarily_unavailable'});
   return send(201,{tenant_id:result.data});
  }catch{return send(503,{error:'temporarily_unavailable'})}
 };
}
