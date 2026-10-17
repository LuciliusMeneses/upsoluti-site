import { NextRequest, NextResponse } from 'next/server';
import { parseLead } from '@/lib/contact';
export const runtime='nodejs';
// Best-effort per-instance protection. Use a shared rate limiter at the edge for multiple instances.
const attempts=new Map<string,{count:number;reset:number}>();
export async function POST(req:NextRequest) {
 const origin=req.headers.get('origin');
 if(origin && origin!==req.nextUrl.origin && origin!==process.env.NEXT_PUBLIC_SITE_URL)return NextResponse.json({error:'Origem inválida'},{status:403});
 const length=Number(req.headers.get('content-length')||0);if(length>16000)return NextResponse.json({error:'Pedido demasiado grande'},{status:413});
 let body:unknown;try {const raw=await req.text();if(new TextEncoder().encode(raw).length>16000)return NextResponse.json({error:'Pedido demasiado grande'},{status:413});body=JSON.parse(raw);}catch{return NextResponse.json({error:'Pedido inválido'},{status:400});}
 const lead=parseLead(body);if(!lead)return NextResponse.json({error:'Campos inválidos'},{status:400});
 if(lead.website)return NextResponse.json({error:'Pedido inválido'},{status:400});
 const now=Date.now();for(const [key,value] of attempts)if(value.reset<now)attempts.delete(key);
 const key=(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown')+':'+lead.email.toLowerCase();
 const bucket=attempts.get(key)||{count:0,reset:now+600000};
 if(bucket.count>=5)return NextResponse.json({error:'Aguarde antes de tentar novamente'},{status:429,headers:{'Retry-After':String(Math.ceil((bucket.reset-now)/1000))}});
 if(attempts.size>10000)return NextResponse.json({error:'Tente mais tarde'},{status:503});
 bucket.count++;attempts.set(key,bucket);
 const webhook=process.env.CONTACT_WEBHOOK_URL;
 if(!webhook)return NextResponse.json({error:'Serviço de contacto indisponível'},{status:503});
 try {
  const url=new URL(webhook);if(url.protocol!=='https:' && !(process.env.NODE_ENV!=='production' && ['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('Invalid webhook');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.CONTACT_WEBHOOK_TOKEN?{Authorization:'Bearer '+process.env.CONTACT_WEBHOOK_TOKEN}:{})},body:JSON.stringify({...lead,receivedAt:new Date().toISOString()}),signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
  if(!response.ok)throw new Error('Delivery failed');
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Não foi possível entregar a mensagem'},{status:502});}
}
