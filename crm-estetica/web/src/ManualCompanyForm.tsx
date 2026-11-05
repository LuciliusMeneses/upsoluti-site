import {useEffect,useRef,useState,type FormEvent} from 'react';
import {supabase} from './api';
import {money,type Locale} from './domain';
import type {Plan} from './commercial';

const messages:Record<string,string>={invalid_password:'Escolha uma senha inicial mais forte, com pelo menos 12 caracteres.',owner_unavailable:'A conta do proprietário não foi encontrada ou ainda não tem acesso confirmado.',owner_already_registered:'Este e-mail já está cadastrado. Selecione a opção de vincular conta existente.',account_limit:'Use uma conta de proprietário separada da administração da plataforma e verifique o limite de estabelecimentos.',request_reused:'Os dados desta solicitação foram alterados. Feche o formulário e inicie um novo cadastro.',invalid_input:'Revise os dados e selecione um plano publicado.',forbidden:'Este cadastro exige acesso à administração da plataforma.',unauthorized:'Sua sessão expirou. Entre novamente para continuar.',rate_limited:'Limite de cadastros por hora atingido. Tente novamente mais tarde.',account_creation_incomplete:'Não foi possível concluir a criação do acesso. Preserve os dados e tente novamente.',temporarily_unavailable:'Não foi possível confirmar o cadastro. Preserve os dados e tente novamente; a mesma solicitação será consultada.'};
export default function ManualCompanyForm({plans,locale,onSaved,onBusy}:{plans:Plan[];locale:Locale;onSaved:()=>Promise<void>;onBusy:(value:boolean)=>void}){
 const [mode,setMode]=useState('existing'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false),[attempted,setAttempted]=useState(false);
 const request=useRef({key:crypto.randomUUID(),payload:''}),pending=useRef(false);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(attempted&&!success){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[attempted,success]);
 const available=plans.filter(p=>p.published);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(pending.current)return;
  if(success){await onSaved();return}
  const element=e.currentTarget,form=new FormData(element),input:Record<string,string>={};
  for(const name of ['name','unit','country','locale','currency','timezone','plan_id','owner_email'])input[name]=String(form.get(name)??'').trim();
  input.owner_mode=mode;input.owner_email=input.owner_email.toLowerCase();if(mode==='new')input.owner_password=String(form.get('owner_password')??'');
  // Keep the same key after uncertain responses; password is never stored in browser storage.
  const payload=JSON.stringify(input);
  if(request.current.payload&&request.current.payload!==payload){setError('Para alterar os dados após uma tentativa, feche o formulário e inicie um novo cadastro. Isso evita duplicar uma empresa cujo resultado ainda não foi confirmado.');return}
  request.current.payload=payload;setAttempted(true);pending.current=true;setBusy(true);onBusy(true);setError('');
  try{
   const session=await supabase!.auth.getSession();const token=session.data.session?.access_token;
   if(!token){setError(messages.unauthorized);return}
   const response=await fetch('/api/platform/company',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({...input,request_id:request.current.key})});
   const data=await response.json();if(!response.ok){setError(messages[data.error]??messages.temporarily_unavailable);if([400,401,403,429].includes(response.status)||data.error==='owner_already_registered'){request.current={key:crypto.randomUUID(),payload:''};setAttempted(false)}return}
   if(typeof data.tenant_id!=='string'){setError(messages.temporarily_unavailable);return}
   setSuccess(true);request.current.payload='';element.reset();await onSaved();
  }catch{setError(messages.temporarily_unavailable)}finally{pending.current=false;setBusy(false);onBusy(false)}
 }
 return <form className="commercial-form" onSubmit={submit}>
  <p className="muted">Cadastre a empresa, a primeira unidade e seu proprietário. O plano define a avaliação; sem avaliação, a assinatura começa pendente de ativação.</p>
  {!available.length&&<p role="alert" className="notice">Publique um plano antes de cadastrar uma empresa.</p>}
  <fieldset disabled={busy||success||!available.length}>
   <div className="two-cols"><label>Nome da empresa<input name="name" required minLength={2} maxLength={100}/></label><label>Primeira unidade<input name="unit" required minLength={2} maxLength={100}/></label></div>
   <label>Plano e versão<select aria-label="Plano e versão" name="plan_id" required defaultValue=""><option value="" disabled>Selecione um plano publicado</option>{available.map(p=><option key={p.id} value={p.id}>{p.name} · v{p.revision} · {money(p.price_cents,locale,p.currency)}/{p.interval_months===12?'ano':'mês'} · {p.trial_days} dias de avaliação</option>)}</select></label>
   <div className="two-cols"><label>País<select name="country" defaultValue="BR"><option value="BR">Brasil</option><option value="PT">Portugal</option></select></label><label>Idioma da empresa<select name="locale" defaultValue={locale}><option>pt-BR</option><option>pt-PT</option></select></label></div>
   <div className="two-cols"><label>Moeda operacional<select name="currency" defaultValue="BRL"><option>BRL</option><option>EUR</option></select></label><label>Fuso horário<select name="timezone" defaultValue="America/Sao_Paulo"><option>America/Sao_Paulo</option><option>Europe/Lisbon</option></select></label></div>
   <h3>Acesso do proprietário</h3>
   <label>Tipo de acesso<select aria-label="Tipo de acesso" name="owner_mode" value={mode} onChange={e=>setMode(e.target.value)} disabled={attempted}><option value="existing">Vincular conta existente</option><option value="new">Criar nova conta</option></select></label>
   <label>E-mail do proprietário<input name="owner_email" type="email" required maxLength={254} autoComplete="off"/></label>
   {mode==='new'?<><label>Senha inicial do proprietário<input name="owner_password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><small>Use pelo menos 12 caracteres. O acesso será liberado administrativamente, sem envio de e-mail. Compartilhe a senha diretamente com o proprietário. Não há troca obrigatória de senha no primeiro acesso nesta etapa.</small></>:<small>A conta deve existir e ter acesso confirmado. Nenhuma senha será alterada.</small>}
   <div className="notice">O administrador da plataforma não será membro da empresa. O cadastro não registra pagamento nem envia mensagens.</div>
  </fieldset>
  {error&&<p role="alert" className="form-error">{error}</p>}
  {success&&<p role="status">Empresa cadastrada. Atualize a listagem para consultar a assinatura.</p>}
  <button className="primary wide" disabled={busy||!available.length}>{busy?'A cadastrar…':success?'Atualizar listagem':locale==='pt-PT'?'Registar empresa':'Cadastrar empresa'}</button>
 </form>
}
