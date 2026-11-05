import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
const account=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8')).accounts.find(x=>x.email==='admin@crm-estetica.test');
const seed=JSON.parse(readFileSync(resolve('../docs/qa-guided-demo/seed-results.json'),'utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.name));await page.goto('https://crm-estetica-test.vercel.app/app');await page.getByLabel('E-mail',{exact:true}).fill(account.email);await page.getByLabel('Senha',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('heading',{name:'Agenda e agendamentos'}).waitFor();
 for(const [name,key] of [['Serviços','services'],['Equipe','professionals'],['Clientes','clients'],['Agenda','agenda']]){
  await page.locator('.sidebar nav').getByRole('button',{name,exact:true}).click();
  if(key==='services'){await page.getByRole('heading',{name:'Limpeza de pele · Teste',exact:true}).waitFor();assert.equal(await page.locator('.op-cards article').count(),4)}
  if(key==='professionals'){await page.getByRole('heading',{name:'Marina · Profissional Teste',exact:true}).waitFor();assert.equal(await page.locator('.op-cards article').count(),3);await page.getByText('Intervalo de treinamento · Teste',{exact:true}).waitFor()}
  if(key==='clients'){await page.getByRole('cell',{name:'Ana · Cliente Teste',exact:true}).waitFor();assert.equal(await page.locator('.op-table tbody tr').count(),8)}
  if(key==='agenda'){await page.getByLabel('Data',{exact:true}).fill(seed.firstDate);await page.locator('.op-booking').first().waitFor();assert.equal(await page.locator('.op-booking').count(),5);await page.reload();await page.getByLabel('Data',{exact:true}).fill(seed.firstDate);await page.locator('.op-booking').first().waitFor()}
  await page.screenshot({path:resolve(`../docs/qa-guided-demo/seeded-${key}.png`),fullPage:true});
 }
 assert.equal(errors.length,0);console.log('Verified persistent seeded services (4), professionals (3), clients (8), hours/block and bookings (5 on first date) on Vercel.');
}finally{await browser.close()}
