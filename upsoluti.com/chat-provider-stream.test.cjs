const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
process.env.NINEROUTER_URL='https://provider.example/v1';process.env.NINEROUTER_KEY='synthetic';process.env.NINEROUTER_MODEL='synthetic';delete process.env.NINEROUTER_FAST_MODEL;
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const out={};cache.set(file,out);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('exports','require',code)(out,id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+'.ts'):require(id));return out;}
const provider=load('src/lib/chat/provider.ts');const originalFetch=global.fetch;
const messages=[{id:'test',role:'user',text:'Quero automação',createdAt:new Date().toISOString()}];
function response(text){const bytes=new TextEncoder().encode(text);return new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=7)controller.enqueue(bytes.slice(i,i+7));controller.close();}}),{headers:{'Content-Type':'text/event-stream; charset=utf-8'}});}
function event(content,finish=null){return 'data: '+JSON.stringify({choices:[{delta:{content},finish_reason:finish}]})+'\r\n\r\n';}
function mock(factory){global.fetch=async(_url,options)=>{assert.equal(JSON.parse(options.body).stream,true);return factory();};}
(async()=>{try{
 const answer=JSON.stringify({answer:'A automação pode ajudar. Que processo pretende melhorar?',contact:{email:'inventado@example.com'},interest:'automatizar'});
 mock(()=>response(': keepalive\n\n'+event(answer.slice(0,23))+event(answer.slice(23),'stop')+'data: [DONE]'));
 const result=await provider.generateReply(messages);assert.ok(result.answer.includes('automação'));assert.equal(result.contact.email,undefined);
 mock(()=>response(event(answer)));await assert.rejects(provider.generateReply(messages),/invalid_provider_reply/);
 mock(()=>response(event(answer,'length')+'data: [DONE]\n'));await assert.rejects(provider.generateReply(messages),/invalid_provider_reply/);
 mock(()=>response('data: malformed\n'));await assert.rejects(provider.generateReply(messages),/invalid_provider_reply/);
 mock(()=>response('data: '+JSON.stringify({error:{message:'upstream error'}})+'\n'));await assert.rejects(provider.generateReply(messages),/provider_unavailable/);
 mock(()=>response('x'.repeat(262145)));await assert.rejects(provider.generateReply(messages),/invalid_provider_reply/);
 mock(()=>new Response(new ReadableStream({start(controller){controller.error(new Error('interrupted'));}}),{headers:{'Content-Type':'text/event-stream'}}));await assert.rejects(provider.generateReply(messages),/interrupted/);
 mock(()=>Response.json({choices:[{message:{content:answer},finish_reason:'stop'}]}));assert.ok((await provider.generateReply(messages)).answer.includes('automação'));
 process.env.NINEROUTER_FAST_MODEL='fast-synthetic';let models=[];
 global.fetch=async(_url,options)=>{const model=JSON.parse(options.body).model;models.push(model);return model==='fast-synthetic'?new Response('{}',{status:503}):Response.json({choices:[{message:{content:answer},finish_reason:'stop'}]});};
 assert.ok((await provider.generateReply(messages)).answer);assert.deepEqual(models,['fast-synthetic','synthetic']);
 models=[];const controller=new AbortController();
 global.fetch=async(_url,options)=>{models.push(JSON.parse(options.body).model);controller.abort();throw new DOMException('Aborted','AbortError');};
 await assert.rejects(provider.generateReply(messages,controller.signal));assert.deepEqual(models,['fast-synthetic']);
 console.log('PASS: provider streaming, split UTF-8/CRLF, completion marker, truncation/error/disconnect rejection, bounded stream, contact grounding and non-stream JSON compatibility.');
}finally{delete process.env.NINEROUTER_FAST_MODEL;global.fetch=originalFetch;}})().catch(e=>{console.error(e);process.exitCode=1});
