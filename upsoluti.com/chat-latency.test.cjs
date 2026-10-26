const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {NextRequest}=require('next/server');
process.env.CHAT_STORE_URL='https://storage.example/chat';process.env.CHAT_LEAD_WEBHOOK_TOKEN='synthetic-only';
process.env.NINEROUTER_URL='https://provider.example/v1';process.env.NINEROUTER_KEY='synthetic-only';process.env.NINEROUTER_MODEL='synthetic';
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const out={};cache.set(file,out);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('exports','require',code)(out,id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+'.ts'):id.startsWith('@/')?load(path.resolve('src',id.slice(2))+'.ts'):require(id));return out;}
const route=load('src/app/api/chat/route.ts'),knowledge=load('src/lib/chat/knowledge.ts');
const originalFetch=global.fetch,calls=[];let parallelReads=false,findStarted=false;
const session={id:'synthetic',messages:[],profile:{},leadStatus:null,expiresAt:'2099-01-01T00:00:00Z'};
let requested;
global.fetch=async(url,options)=>{
 const body=JSON.parse(options.body);
 if(String(url)==='https://provider.example/v1/chat/completions')return Response.json({choices:[{message:{content:JSON.stringify({answer:'Podemos ajudar com o CRM. Qual o processo atual?',contact:{}})},finish_reason:'stop'}]});
 assert.equal(String(url),'https://storage.example/chat');calls.push(body.action);
 switch(body.action){
  case 'get':return Response.json({data:session});
  case 'rate':case 'acquire':case 'release':return Response.json({data:true});
  case 'requestText':await new Promise(resolve=>setImmediate(resolve));parallelReads=findStarted;return Response.json({data:null});
  case 'findReply':findStarted=true;return Response.json({data:null});
  case 'user':requested=body.data.requestId;session.messages.push({id:requested+'-user',role:'user',text:body.data.text,createdAt:new Date().toISOString()});return Response.json({data:true});
  case 'reply':session.messages.push({id:requested+'-assistant',role:'assistant',text:body.data.reply.answer,createdAt:new Date().toISOString()});session.profile=body.data.profile;return Response.json({data:true});
  default:throw Error('Unexpected storage operation: '+body.action);
 }
};
(async()=>{try{
 const response=await route.POST(new NextRequest('https://site.example/api/chat',{method:'POST',headers:{origin:'https://site.example','content-type':'application/json',cookie:'upsoluti_chat='+'a'.repeat(64)},body:JSON.stringify({action:'send',requestId:'12345678-1234-1234-1234-123456789abc',message:'Quero um CRM',leadConsent:true})}));
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.conversation.messages.length,2);assert.equal(result.conversation.leadStatus,null);
 assert.equal(calls.filter(a=>a==='get').length,3,'no extra get after unchanged lead status');assert.equal(calls.includes('getLead'),false,'no lead read without minimum contacts');assert.equal(parallelReads,true,'idempotency lookups execute together');
 const prompt=knowledge.chatInstructions('Quero SEO');assert.ok(prompt.includes('Desde 190 €'));assert.ok(prompt.includes('Não aplicar este preço ao Site + CRM'));assert.ok(prompt.includes('CONHECIMENTO OFICIAL'));assert.ok(prompt.includes('"faqs"'));
 const general=knowledge.chatInstructions('Olá');assert.ok(general.length<prompt.length);assert.ok(general.includes('Software'));assert.ok(!general.includes('"faqs"'));
 console.log('PASS: parallel cache reads, minimum-contact fast path, unchanged capture skips refresh, compact context retains service catalog, relevant detail and commercial rules.');
}finally{global.fetch=originalFetch;}})().catch(error=>{console.error(error);process.exitCode=1});
