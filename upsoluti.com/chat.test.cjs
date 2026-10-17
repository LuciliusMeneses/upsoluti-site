const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'upsoluti-chat-'));
process.env.CHAT_STORAGE_PATH=path.join(dir,'test.sqlite');
process.env.NINEROUTER_URL='http://127.0.0.1:20128/v1';process.env.NINEROUTER_KEY='test-only';process.env.NINEROUTER_MODEL='Atendente';
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('exports','require','module',code)(mod.exports,id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+'.ts'):id.startsWith('@/')?load(path.resolve('src',id.slice(2))+'.ts'):require(id),mod);return mod.exports;}
const store=load('src/lib/chat/store.ts'),provider=load('src/lib/chat/provider.ts');
try{
assert.equal(provider.providerConfig().model,'Atendente');assert.equal(provider.providerConfig().endpoint,'http://127.0.0.1:20128/v1/chat/completions');
const a=store.createConversation(),b=store.createConversation();assert.notEqual(a.token,b.token);assert.equal(store.getConversation('bad'),null);assert.equal(store.getConversation(a.token).id,a.conversation.id);
assert.equal(store.acquireConversation(a.conversation.id),true);assert.equal(store.acquireConversation(a.conversation.id),false);store.releaseConversation(a.conversation.id);assert.equal(store.acquireConversation(a.conversation.id),true);store.releaseConversation(a.conversation.id);
store.saveUserMessage(a.conversation.id,'request','Meu nome é Ana');store.saveUserMessage(a.conversation.id,'request','Meu nome é Ana');assert.equal(store.getConversation(a.token).messages.length,1);assert.equal(store.getConversation(b.token).messages.length,0);
const reply=provider.parseProviderReply(JSON.stringify({answer:'Como posso ajudar?',contact:{name:'Ana',email:'inventado@example.com'},serviceSlug:'invalid',interest:'invalid'}),store.getConversation(a.token).messages);assert.equal(reply.contact.name,'Ana');assert.equal(reply.contact.email,undefined);assert.equal(reply.serviceSlug,'');
store.saveReply(a.conversation.id,'request',reply,reply.contact);assert.equal(store.getConversation(a.token).messages.length,2);assert.equal(store.findReply(a.conversation.id,'request').answer,reply.answer);
assert.equal(store.consumeRateLimit('test',1,10000),true);assert.equal(store.consumeRateLimit('test',1,10000),false);
const lead=store.saveLead(a.conversation.id,{name:'Ana'},reply.contact);assert.equal(lead.status,'pending');store.markLeadSynced(lead.id);assert.equal(store.getStoredLead(a.conversation.id).status,'synced');
store.deleteConversation(a.conversation.id);assert.equal(store.getConversation(a.token),null);assert.equal(store.getStoredLead(a.conversation.id),null);assert.ok(store.getConversation(b.token));
process.env.NINEROUTER_URL='http://external.example';assert.equal(provider.providerConfig(),null);
console.log('PASS: chat isolation, persistence, locks, idempotency, grounded profiles, rate limits, lead status, deletion and provider configuration.');
}finally{store.getDatabase().close();for(const file of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,file));fs.rmdirSync(dir);}
