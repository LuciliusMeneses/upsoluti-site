const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { NextRequest } = require('next/server');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upsoluti-capture-'));
process.env.CHAT_STORAGE_PATH = path.join(dir, 'test.sqlite');
delete process.env.CHAT_STORE_URL;
process.env.NINEROUTER_URL = 'https://provider.example/v1';
process.env.NINEROUTER_KEY = 'test-only'; process.env.NINEROUTER_MODEL = 'test';
process.env.CHAT_LEAD_WEBHOOK_URL = 'https://crm.example/intake';
process.env.CHAT_LEAD_WEBHOOK_TOKEN = 'test-only';
const cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('exports', 'require', 'module', code)(mod.exports, id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id) + '.ts') : id.startsWith('@/') ? load(path.resolve('src', id.slice(2)) + '.ts') : require(id), mod);
  return mod.exports;
}
const store = load('src/lib/chat/store.ts'), route = load('src/app/api/chat/route.ts');
const originalFetch = global.fetch;
let deliveries = [], providerCalls = 0, rejectDelivery = false;
global.fetch = async (url, options) => {
  url = String(url);
  if (url === 'https://crm.example/intake') {
    deliveries.push({ id: options.headers['Idempotency-Key'], payload: JSON.parse(options.body) });
    return new Response('{}', { status: rejectDelivery ? 503 : 200 });
  }
  assert.equal(url, 'https://provider.example/v1/chat/completions'); providerCalls++;
  const provided = JSON.parse(options.body).messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  const contact = { name: provided.includes('Teste Visual') ? 'Teste Visual' : '', email: provided.includes('visual@example.com') ? 'visual@example.com' : '' };
  return Response.json({ choices: [{ message: { content: JSON.stringify({ answer: 'Vamos avaliar a automação. Qual é o seu processo atual?', contact, interest: 'automatizar' }) }, finish_reason: 'stop' }] });
};
async function post(token, body) {
  const response = await route.POST(new NextRequest('https://site.example/api/chat', { method: 'POST', headers: { origin: 'https://site.example', 'content-type': 'application/json', cookie: 'upsoluti_chat=' + token }, body: JSON.stringify(body) }));
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}
(async () => {
  try {
    const a = store.createConversation();
    await post(a.token, { action: 'send', requestId: randomUUID(), message: 'Sou Teste Visual e quero automatizar vendas.', leadConsent: true });
    assert.equal(deliveries.length, 0, 'missing email must not create a lead');
    const id = randomUUID(), message = 'O meu e-mail é visual@example.com';
    await post(a.token, { action: 'send', requestId: id, message, leadConsent: false });
    assert.equal(deliveries.length, 0, 'contact details alone are not consent');
    const calls = providerCalls;
    const captured = await post(a.token, { action: 'send', requestId: id, message, leadConsent: true, source: '/solucoes/automatizar' });
    assert.equal(providerCalls, calls, 'cached reply should not call AI again');
    assert.equal(captured.conversation.leadStatus, 'synced');
    assert.equal(deliveries.length, 1);
    const delivered = deliveries[0];
    assert.equal(delivered.id, delivered.payload.id);
    assert.equal(delivered.payload.event, 'public_chat.lead');
    assert.equal(delivered.payload.lead.email, 'visual@example.com');
    assert.equal(delivered.payload.lead.company, '', 'do not invent a company');
    assert.equal(delivered.payload.lead.source, '/solucoes/automatizar');
    assert.equal(delivered.payload.transcript.length, 4);
    assert.ok(delivered.payload.transcript.some(m => m.text.includes('automatizar vendas')));
    assert.ok(delivered.payload.consentAt);
    await post(a.token, { action: 'send', requestId: id, message, leadConsent: true });
    await post(a.token, { action: 'retryLead' });
    assert.equal(deliveries.length, 1, 'synced lead must never be sent twice');
    const b = store.createConversation(); rejectDelivery = true;
    const pending = await post(b.token, { action: 'send', requestId: randomUUID(), message: 'Sou Teste Visual, visual@example.com, preciso automatizar processos.', leadConsent: true });
    assert.ok(pending.reply.answer); assert.equal(pending.conversation.leadStatus, 'pending');
    const failedId = deliveries.at(-1).id;
    rejectDelivery = false;
    const retried = await post(b.token, { action: 'retryLead' });
    assert.equal(retried.conversation.leadStatus, 'synced');
    assert.equal(deliveries.at(-1).id, failedId);
    assert.notEqual(failedId, delivered.id, 'visitors must be isolated');
    const stranger = store.createConversation();
    assert.equal(store.getStoredLead(stranger.conversation.id), null);
    console.log('PASS: real chat route + SQLite, explicit consent, minimum contacts, cached capture, full context, existing webhook envelope, isolation, pending/retry and no duplicate delivery.');
  } finally {
    global.fetch = originalFetch; store.getDatabase().close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
