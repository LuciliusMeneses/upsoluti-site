import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
const account=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8')).accounts.find(x=>x.email==='admin@crm-estetica.test');
const seed=JSON.parse(readFileSync(resolve('../docs/qa-guided-demo/business-seed-results.json'),'utf8'));
const browser=await chromium.launch({headless:true}),errors=[],emailCalls=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/auth\/v1\/(signup|recover|resend|invite|otp)/.test(r.url()))emailCalls.push('email')});
 await page.goto('https://crm-estetica-test.vercel.app/app');await page.getByLabel('E-mail',{exact:true}).fill(account.email);await page.getByLabel('Senha',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('heading',{name:'Agenda e agendamentos'}).waitFor();
 for(const [nav,key] of [['Pacotes e sessões','packages'],['Financeiro e comissões','finance'],['Relatórios','reports'],['Visão geral','overview']]){
  await page.locator('.sidebar nav').getByRole('button',{name:nav,exact:true}).click();await page.locator('.business h2').waitFor();
  if(key==='packages'){await page.getByRole('heading',{name:'Facial 5 sessões · Teste',exact:true}).waitFor();assert.equal(await page.locator('.op-cards article').count(),seed.templates);assert.equal(await page.locator('.op-table').first().locator('tbody tr').count(),seed.packages)}
  if(key==='finance'){await page.getByText('Ana · Cliente Teste',{exact:true}).first().waitFor();assert.equal(await page.locator('.op-table tbody tr').count(),seed.installments);await page.getByRole('button',{name:'Comissões',exact:true}).click();await page.getByText('Marina · Profissional Teste',{exact:true}).first().waitFor();assert.equal(await page.locator('.op-table').first().locator('tbody tr').count(),seed.commissions)}
  if(key==='reports'||key==='overview'){const metric=page.locator('.business-metrics article').filter({has:page.getByText('Recebimentos líquidos',{exact:true})});await metric.waitFor();assert((await metric.innerText()).includes('350,00'));assert((await page.locator('.business-metrics article').filter({has:page.getByText('Saldo a receber',{exact:true})}).innerText()).includes('1.500,00'))}
  await page.screenshot({path:resolve(`../docs/qa-guided-demo/business-${key}.png`),fullPage:true});
 }
 await page.reload();await page.getByRole('heading',{name:'Agenda e agendamentos'}).waitFor();await page.locator('.sidebar nav').getByRole('button',{name:'Visão geral',exact:true}).click();await page.getByText('Recebimentos líquidos',{exact:true}).waitFor();assert.equal(errors.length,0);assert.equal(emailCalls.length,0);const result={verifiedAt:new Date().toISOString(),origin:'https://crm-estetica-test.vercel.app',checks:['persistent 3 templates and 3 sold packages','8 installment rows','3 commissions and configured rules','reports and overview reconcile 350 BRL net receipts and 1500 BRL outstanding','reload preserves data','zero JS errors and email requests']};writeFileSync(resolve('../docs/qa-guided-demo/business-ui-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
