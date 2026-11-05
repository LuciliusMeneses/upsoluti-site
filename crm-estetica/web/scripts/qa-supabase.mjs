import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Only the explicitly created project is allowed. No keys/tokens in results or fixtures.
const REF = 'lxzyybcvmlooiyvxmosp';
const url = `https://${REF}.supabase.co`;
const publicKey = process.env.CRM_ESTETICA_PUBLIC_KEY;
const serviceKey = process.env.CRM_ESTETICA_QA_SERVICE_KEY;
if (!publicKey || !serviceKey) throw Error('QA server credentials required in process environment');
const root = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = resolve(root, '..');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, serviceKey, options);
const client = () => createClient(url, publicKey, options);
const runId = randomUUID().replaceAll('-', '').slice(0, 16);
const users = [], tenants = [], checks = [];
function saveManifest() {
  mkdirSync(resolve(projectRoot, '.local'), {recursive:true});
  writeFileSync(resolve(projectRoot, `.local/qa-${runId}.json`), JSON.stringify({runId, users, tenants}));
}
const report = { project: REF, runId, checkedAt: new Date().toISOString(), checks, emailDelivery: 'not tested; generated Auth links without SMTP delivery', cleanup: false };
const resultDir = resolve(projectRoot, 'docs/qa-foundation');
mkdirSync(resultDir, { recursive: true });
const assertOk = (result, step) => { if (result.error) throw Error(`${step}: ${result.error.code ?? result.error.status ?? 'request_failed'}`); return result.data; };
async function signupFixture(name) {
  const email = `qa-${runId}-${name}@example.test`, password = `Qa!${randomUUID()}9`;
  const generated = assertOk(await admin.auth.admin.generateLink({ type: 'signup', email, password, options: { redirectTo: 'http://127.0.0.1:3220/auth/callback' } }), 'generate signup');
  users.push(generated.user.id);
  saveManifest();
  const sdk = client();
  assert((await sdk.auth.signInWithPassword({ email, password })).error, 'unconfirmed account must not log in');
  assertOk(await sdk.auth.verifyOtp({ token_hash: generated.properties.hashed_token, type: 'signup' }), 'confirm signup');
  assertOk(await sdk.auth.signInWithPassword({ email, password }), 'login');
  return { sdk, email, password, id: generated.user.id };
}
function company(name) { return { name: `QA ${runId} ${name}`, unit: 'QA unit', locale: 'pt-PT', country: 'PT', currency: 'EUR', timezone: 'Europe/Lisbon' }; }
async function newCompany(sdk, name) {
  const id = assertOk(await sdk.rpc('create_establishment', { p_input: company(name) }), 'onboarding');
  tenants.push(id); saveManifest(); return id;
}
let failure;
try {
  const owner = await signupFixture('owner');
  const other = await signupFixture('other');
  const member = await signupFixture('member');
  checks.push('Auth signup link, unconfirmed login denied, confirmation and password login');
  const a = await newCompany(owner.sdk, 'A'), b = await newCompany(other.sdk, 'B');
  assert.equal(assertOk(await owner.sdk.from('tenants').select('*'), 'tenant read').length, 1);
  for (const table of ['tenants', 'units', 'memberships', 'audit_events']) {
    const rows = assertOk(await other.sdk.from(table).select('*').eq(table === 'tenants' ? 'id' : 'tenant_id', a), 'cross tenant read');
    assert.equal(rows.length, 0, `cross tenant leak in ${table}`);
  }
  assert((await other.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: member.email, p_role: 'manager' })).error);
  assert((await owner.sdk.from('memberships').insert({ tenant_id: b, user_id: owner.id, role: 'owner' })).error);
  assert((await owner.sdk.from('tenants').update({ name: 'Unauthorized' }).eq('id', a)).error);
  assert((await owner.sdk.from('audit_events').delete().eq('tenant_id', a)).error);
  assert((await owner.sdk.rpc('create_establishment', { p_input: { ...company('invalid'), name: { nested: true } } })).error);
  checks.push('tenant isolation through Data API, forbidden role writes and immutable audit');
  const token = assertOk(await owner.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: member.email, p_role: 'reception' }), 'create invitation');
  assert((await other.sdk.rpc('accept_member_invitation', { p_token: token })).error);
  assert.equal(assertOk(await member.sdk.rpc('accept_member_invitation', { p_token: token }), 'accept invitation'), a);
  assert((await member.sdk.rpc('accept_member_invitation', { p_token: token })).error);
  const ownMembership = assertOk(await member.sdk.from('memberships').select('role,tenant_id'), 'member role');
  assert.equal(ownMembership[0].role, 'reception');
  assert.equal(assertOk(await member.sdk.from('audit_events').select('*'), 'audit restriction').length, 0);
  assert((await member.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: other.email, p_role: 'manager' })).error);
  assert((await owner.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: member.email, p_role: 'owner' })).error);
  checks.push('invitation email binding, single use, reception restrictions and owner escalation denied');
  const managerToken = assertOk(await owner.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: other.email, p_role: 'manager' }), 'manager invitation');
  assertOk(await other.sdk.rpc('accept_member_invitation', { p_token: managerToken }), 'multi tenant membership');
  assert.equal(assertOk(await other.sdk.from('tenants').select('id'), 'multiple establishments').length, 2);
  assert((await other.sdk.rpc('create_member_invitation', { p_tenant: a, p_email: member.email, p_role: 'reception' })).error);
  checks.push('explicit multiple establishment membership and manager restrictions');
  const professional = await signupFixture('professional');
  const professionalToken = assertOk(await owner.sdk.rpc('create_member_invitation', {p_tenant:a,p_email:professional.email,p_role:'professional'}), 'professional invitation');
  const concurrent = await Promise.all([
    professional.sdk.rpc('accept_member_invitation', {p_token:professionalToken}),
    professional.sdk.rpc('accept_member_invitation', {p_token:professionalToken}),
  ]);
  assert.equal(concurrent.filter(r=>!r.error).length,1);
  assert.equal(assertOk(await professional.sdk.from('memberships').select('role'), 'professional role')[0].role,'professional');
  assert.equal(assertOk(await professional.sdk.from('audit_events').select('*'), 'professional audit').length,0);
  assert((await professional.sdk.rpc('create_member_invitation', {p_tenant:a,p_email:member.email,p_role:'manager'})).error);
  const expired = assertOk(await owner.sdk.rpc('create_member_invitation', {p_tenant:a,p_email:professional.email,p_role:'manager'}), 'expiring invitation');
  assertOk(await admin.from('member_invitations').update({expires_at:new Date(Date.now()-60000).toISOString()}).eq('tenant_id',a).eq('email',professional.email).is('accepted_at',null), 'expire synthetic invitation');
  assert((await professional.sdk.rpc('accept_member_invitation',{p_token:expired})).error);
  assertOk(await admin.from('memberships').update({active:false}).eq('tenant_id',a).eq('user_id',professional.id), 'revoke synthetic membership');
  assert.equal(assertOk(await professional.sdk.from('tenants').select('id'), 'revoked membership').length,0);
  checks.push('professional permissions, concurrent invite consumption, expiration and revoked membership denied');
  const anonymous = client();
  assert((await anonymous.from('tenants').select('*')).error);
  assert((await anonymous.rpc('create_establishment', { p_input: company('anonymous') })).error);
  const upload = await member.sdk.storage.from('establishment-private').upload(`${a}/qa-${runId}.txt`, new Blob(['synthetic QA']));
  assert(upload.error, 'private bucket must reject unimplemented upload');
  checks.push('anonymous access denied; private Storage cannot be written by member');

  // Browser receives only public key + synthetic login data. Never the service key.
  const require = createRequire(import.meta.url);
  const { chromium } = require(resolve(projectRoot, '../node_modules/playwright'));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.name));
  try {
    await page.goto('http://127.0.0.1:3220');
    await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
    await page.getByLabel('E-mail', { exact: true }).fill(owner.email);
    await page.getByLabel('Senha', { exact: true }).fill(owner.password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.getByText(company('A').name, { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'Configurações', exact: true }).click();
    await page.getByRole('button', { name: 'Convites', exact: true }).click();
    await page.getByLabel('E-mail do membro', { exact: true }).fill(member.email);
    await page.getByRole('button', { name: 'Criar convite · 48 h', exact: true }).click();
    await page.getByText('Convite criado.', { exact: false }).waitFor();
    assert.equal((await page.getByRole('textbox', { name: 'Código privado · apresentado uma vez' }).inputValue()).length, 64);
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.getByRole('heading', { name: 'Entrar', exact: true }).waitFor();
    checks.push('browser real login, owner invitation UI and logout');

    const recovery = assertOk(await admin.auth.admin.generateLink({ type: 'recovery', email: owner.email, options: { redirectTo: 'http://127.0.0.1:3220/auth/reset' } }), 'generate recovery link');
    // Construct a session using the real Auth verification endpoint, then open the
    // same documented implicit callback format emitted by Supabase email links.
    const recoveryClient = client();
    const recovered = assertOk(await recoveryClient.auth.verifyOtp({ token_hash: recovery.properties.hashed_token, type: 'recovery' }), 'verify recovery');
    const session = recovered.session;
    assert(session);
    const hash = new URLSearchParams({ access_token: session.access_token, refresh_token: session.refresh_token, expires_in: String(session.expires_in), token_type: 'bearer', type: 'recovery' });
    await page.goto(`http://127.0.0.1:3220/auth/reset#${hash}`);
    await page.getByRole('heading', { name: 'Nova senha' }).waitFor();
    const nextPassword = `Qa!${randomUUID()}8`;
    await page.getByLabel('Senha', { exact: true }).fill(nextPassword);
    await page.getByLabel('Confirmar senha', { exact: true }).fill(nextPassword);
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await page.getByText('Acesso atualizado com sucesso.').waitFor();
    assert((await client().auth.signInWithPassword({ email: owner.email, password: owner.password })).error);
    assertOk(await client().auth.signInWithPassword({ email: owner.email, password: nextPassword }), 'new password login');
    assert(!new URL(page.url()).hash, 'tokens removed from address after recovery');
    checks.push('browser recovery callback, password confirmation, actual password update and new login');
    await page.getByRole('button', { name: 'Configurações', exact: true }).click();
    await page.screenshot({ path: join(resultDir, 'settings-real-auth-1440.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: join(resultDir, 'settings-real-auth-390.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(errors.length, 0);
    checks.push('authenticated settings desktop/mobile without JS errors or page overflow');
    const newcomer = await signupFixture('onboarding');
    const fresh = await browser.newContext({viewport:{width:390,height:900}});
    try {
      const formPage = await fresh.newPage();
      await formPage.goto('http://127.0.0.1:3220/auth/callback');
      await formPage.getByLabel('E-mail',{exact:true}).fill(newcomer.email);
      await formPage.getByLabel('Senha',{exact:true}).fill(newcomer.password);
      await formPage.getByRole('button',{name:'Entrar',exact:true}).click();
      await formPage.getByRole('heading',{name:'Criar estabelecimento',exact:true}).waitFor();
      await formPage.getByLabel('Nome do estabelecimento',{exact:true}).fill(company('UI').name);
      await formPage.getByLabel('Primeira unidade',{exact:true}).fill('QA unidade móvel');
      await formPage.getByLabel(/^País/).selectOption('PT');
      await formPage.getByLabel(/^Moeda/).selectOption('EUR');
      await formPage.getByLabel(/^Fuso horário/).selectOption('Europe/Lisbon');
      await formPage.getByRole('button',{name:'Criar estabelecimento',exact:true}).click();
      await formPage.getByText('A sua agenda começa aqui',{exact:true}).waitFor();
      const persisted = assertOk(await newcomer.sdk.from('tenants').select('*'), 'UI onboarding persisted');
      tenants.push(persisted[0].id); saveManifest();
      assert.equal(persisted.length,1);assert.equal(persisted[0].currency,'EUR');assert.equal(persisted[0].timezone,'Europe/Lisbon');
      assert.equal(assertOk(await newcomer.sdk.from('units').select('name'), 'UI unit')[0].name,'QA unidade móvel');
      checks.push('mobile onboarding creates tenant, first unit and owner with configured region in remote database');
    } finally {await fresh.close()}
  } finally { await context.close(); await browser.close(); }
  assertOk(await owner.sdk.auth.signOut(), 'signout');
} catch (error) {
  failure = error;
  report.failure = { name: error.name, step: String(error.message).replace(/https?:\/\/\S+/g, '[URL omitted]').slice(0, 250) };
} finally {
  // Cleanup addresses only IDs created by this execution, never an existing tenant.
  try {
    if (tenants.length) {
      assert(tenants.every(id => /^[0-9a-f-]{36}$/.test(id)));
      const ids = tenants.map(id => `'${id}'`).join(',');
      const sql = `begin;delete from public.member_invitations where tenant_id in (${ids});delete from public.audit_events where tenant_id in (${ids});delete from public.units where tenant_id in (${ids});delete from public.memberships where tenant_id in (${ids});delete from public.tenants where id in (${ids}) and name like 'QA ${runId} %';commit;`;
      const file = resolve(projectRoot, '.local/qa-cleanup.sql');
      writeFileSync(file, sql);
      const cli = join(process.env.APPDATA, 'npm/node_modules/supabase/dist/supabase.js');
      execFileSync(process.execPath, [cli, 'db', 'query', '--linked', '--project-ref', REF, '--file', file, '--output', 'json'], { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    }
    for (const id of users) assertOk(await admin.auth.admin.deleteUser(id), 'remove synthetic Auth user');
    report.cleanup = true;
  } catch { report.cleanup = false; process.exitCode = 1; }
  writeFileSync(join(resultDir, 'supabase-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
if (failure) process.exitCode = 1;
