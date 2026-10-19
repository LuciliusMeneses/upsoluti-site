const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'upsoluti-memory-'));process.env.CHAT_STORAGE_PATH=path.join(dir,'test.sqlite');
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const out={};cache.set(file,out);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('exports','require',code)(out,id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+'.ts'):require(id));return out;}
const store=load('src/lib/chat/store.ts'),memory=load('src/lib/chat/memory.ts'),kb=load('src/lib/chat/service-contexts.ts'),provider=load('src/lib/chat/provider.ts');
const intake=load('src/lib/chat/intake.ts');
const user=text=>({role:'user',text}), assistant=text=>({role:'assistant',text});
assert.ok(intake.anaGreeting.includes('Ana, atendente virtual da UPsoluti'));
assert.ok(intake.intakeInstructions([user('Maria')],{}).includes('extrai-o para contact.name'));
assert.ok(intake.intakeInstructions([user('Maria'),assistant('Como posso ajudar?'),user('Preciso de SEO')],{name:'Maria'}).includes('pede apenas o número de telefone'));
const phoneAsked=[user('Maria'),assistant('Como posso ajudar?'),user('SEO'),assistant('Qual o telefone?'),user('910000000')];
assert.ok(intake.intakeInstructions(phoneAsked,{}).includes('pede apenas o e-mail'));
assert.ok(!intake.intakeInstructions([...phoneAsked,assistant('Qual o e-mail?'),user('m@example.com')],{}).includes('pede apenas'));
assert.ok(!intake.intakeInstructions(Array.from({length:4},()=>user('SEO')),{phone:'910000000',email:'m@example.com'}).includes('pede apenas'));
(async()=>{const originalFetch=global.fetch;try{
 const first=store.createConversation(),other=store.createConversation();
 store.setConversationProfile(first.conversation.id,{memoryEnabled:true});store.saveUserMessage(first.conversation.id,'request','Preciso automatizar o acompanhamento do CRM');
 const session=store.getConversation(first.token),notes=memory.visitorMemory(session.messages,session.profile);
 const next=store.restartConversation(first.token,{memoryEnabled:true,memoryNotes:notes});assert.notEqual(next.conversation.id,session.id);assert.equal(next.conversation.messages.length,0);assert.equal(next.conversation.expiresAt,session.expiresAt);assert.ok(next.conversation.profile.memoryNotes[0].includes('CRM'));assert.equal(store.getConversation(other.token).profile.memoryNotes,undefined);
 assert.deepEqual(memory.visitorMemory(session.messages,{memoryEnabled:false}),[]);
 assert.deepEqual(memory.visitorMemory([{role:'assistant',text:'invented'},{role:'user',text:'Minha senha e segredo'}],{memoryEnabled:true}),[]);
 const redacted=memory.visitorMemory([{role:'user',text:'Email ana@example.com telefone +351 910 000 000'}],{memoryEnabled:true});assert.ok(!redacted[0].includes('ana@example.com'));assert.ok(!redacted[0].includes('910'));
 assert.equal(kb.relevantServiceContexts('Quero SEO e posicionamento orgânico')[0].slug,'seo');assert.equal(Object.keys(kb.serviceContexts).length,6);assert.ok(kb.relevantServiceContexts('Quero automatizar o CRM').some(s=>s.slug==='automacao'));
 const msgs=Array.from({length:20},(_,i)=>({id:String(i),role:'user',text:'Mensagem '+i,createdAt:new Date().toISOString()}));assert.equal(memory.conversationContext(msgs,{memoryEnabled:false,memoryNotes:['private']}).previousConversations.length,0);assert.equal(memory.conversationContext(msgs,{}).earlierInThisConversation.length,8);
 process.env.NINEROUTER_URL='https://provider.example';process.env.NINEROUTER_KEY='test';process.env.NINEROUTER_MODEL='test';let sent;
 global.fetch=async(_url,init)=>{sent=JSON.parse(init.body);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'Posso ajudar com o CRM.'})}}]}));};
 await provider.generateReply(msgs,undefined,next.conversation.profile);assert.equal(sent.messages.filter(m=>m.role==='system').length,1);assert.ok(sent.messages[1].content.includes('acompanhamento do CRM'));assert.ok(sent.messages[0].content.includes('CONHECIMENTO OFICIAL'));
 store.deleteConversation(next.conversation.id);assert.equal(store.getConversation(first.token),null);assert.equal(store.getConversation(next.token),null);assert.ok(store.getConversation(other.token));
 console.log('PASS: service retrieval, opt-in memory, continuity, retention, isolation, deletion and provider context.');
 }finally{global.fetch=originalFetch;store.getDatabase().close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
