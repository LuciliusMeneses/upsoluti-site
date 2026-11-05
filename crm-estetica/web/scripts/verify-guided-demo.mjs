import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../node_modules/playwright');
const operator=JSON.parse(readFileSync(resolve('../.local/platform-access.json'),'utf8'));
const owner=JSON.parse(readFileSync(resolve('../.local/test-access.json'),'utf8')).accounts.find(a=>a.email==='admin@crm-estetica.test');
const browser=await chromium.launch({headless:true});const errors=[];const dir=resolve('../docs/qa-guided-demo');mkdirSync(dir,{recursive:true});
try{
 for(const [path,account] of [['/platform',operator],['/app',owner]]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.name));
  await page.goto('https://crm-estetica-test.vercel.app'+path);await page.getByLabel('E-mail',{exact:true}).fill(account.email);await page.getByLabel('Senha',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Entrar',exact:true}).click();
  if(path==='/platform'){await page.getByRole('button',{name:'Planos e limites',exact:true}).click();await page.getByRole('heading',{name:'Teste — sem cobrança',exact:true}).first().waitFor();await page.locator('.plan-card').filter({has:page.getByRole('heading',{name:'Teste — sem cobrança',exact:true})}).filter({has:page.getByText('Publicado',{exact:true})}).waitFor()}
  else{await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByRole('heading',{name:'Teste — sem cobrança',exact:true}).waitFor();await page.getByText('Em avaliação',{exact:true}).waitFor();await page.getByText('Estética Demonstração',{exact:true}).first().waitFor()}
  await page.screenshot({path:resolve(dir,path==='/platform'?'published-plan.png':'selected-subscription.png'),fullPage:true});await context.close();
 }
 if(errors.length)throw Error('Browser JS errors');console.log('Verified on Vercel: published free test plan and establishment subscription in trial.');
}finally{await browser.close()}
