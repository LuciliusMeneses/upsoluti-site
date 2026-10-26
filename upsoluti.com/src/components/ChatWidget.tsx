"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Bot, Check, Download, LoaderCircle, Mail, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { goals, budgets } from '@/lib/lead-options';
import { services } from '@/lib/navigation';
import type { ChatConfig, ChatConversation, ChatMessage, ChatProfile, ChatReply } from '@/lib/chat/types';

import { anaGreeting, withoutManualConfirmation } from '@/lib/chat/intake';

const defaults: ChatConfig = { aiAvailable: false, bookingUrl: null, retentionDays: 30 };
const initialLead = { name: '', email: '', phone: '', company: '', goal: '', message: '', timing: 'exploring', budget: 'to-define', website: '' };

async function chatRequest(body?: Record<string, unknown>, method = body ? 'POST' : 'GET') {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 75000);
  try {
    const response = await fetch(method === 'GET' ? '/api/chat?fresh=1' : '/api/chat', { method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível concluir o pedido. Tente novamente.');
    return data as { config?: ChatConfig; conversation?: ChatConversation | null; reply?: ChatReply; leadStatus?: 'pending' | 'synced'; leadCaptureError?: string };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('A resposta demorou mais do que o esperado. Pode tentar novamente.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export function FloatingChat() {
  const pathname = usePathname();
  return pathname === '/' ? null : <ChatWidget />;
}

const suggestions = ['Quero automatizar processos', 'Preciso de um CRM inteligente', 'Como posso utilizar IA na minha empresa?', 'Quero desenvolver um sistema personalizado', 'Preciso de melhorar o meu marketing digital'];

export default function ChatWidget({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const [remember,setRemember]=useState(false);
  const [open, setOpen] = useState(embedded);
  const [mobile, setMobile] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [booting, setBooting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<ChatConfig>(defaults);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [tab, setTab] = useState<'chat' | 'contact'>('chat');
  const [input, setInput] = useState('');
  const [optimistic, setOptimistic] = useState<ChatMessage | null>(null);
  const [failed, setFailed] = useState<{ id: string; text: string } | null>(null);
  const [handoffSuggested, setHandoffSuggested] = useState(false);
  const [lead, setLead] = useState(initialLead);
  const [consent, setConsent] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const inFlight = useRef(false);
  const fullscreen = open && mobile && (!embedded || (!!conversation && !minimized));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const change = () => setMobile(media.matches);
    change(); media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (!open || initialized) return;
    let cancelled = false;
    setBooting(true); setError('');
    chatRequest().then(data => {
      if (cancelled) return;
      setConfig(data.config || defaults);
      setConversation(data.conversation || null);
      const last = data.conversation?.messages.at(-1);
      if (last?.role === 'user') setFailed({ id: last.id.replace(/-user$/, ''), text: last.text });
      setInitialized(true);
    }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Não foi possível abrir o atendimento.'); }).finally(() => { if (!cancelled) setBooting(false); });
    return () => { cancelled = true; };
  }, [open, initialized]);

  useEffect(() => {
    if (!open || (embedded && !fullscreen)) return;
    const previous = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    const focus = window.requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('.chat-close')?.focus());
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { if (embedded) setMinimized(true); else setOpen(false); window.requestAnimationFrame(() => launcher.current?.focus()); }
      if (event.key !== 'Tab' || !mobile || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled):not([tabindex="-1"]), select:not(:disabled), textarea:not(:disabled)')).filter(element => element.getClientRects().length > 0);
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', keydown);
    return () => { window.cancelAnimationFrame(focus); document.removeEventListener('keydown', keydown); if (mobile) document.body.style.overflow = previous; };
  }, [open, mobile, embedded, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const viewport = window.visualViewport;
    const element = panel.current;
    const update = () => {
      element?.style.setProperty('--chat-viewport-height', `${viewport?.height || window.innerHeight}px`);
      element?.style.setProperty('--chat-viewport-top', `${viewport?.offsetTop || 0}px`);
    };
    update(); viewport?.addEventListener('resize', update); viewport?.addEventListener('scroll', update); window.addEventListener('resize', update);
    return () => { viewport?.removeEventListener('resize', update); viewport?.removeEventListener('scroll', update); window.removeEventListener('resize', update); element?.style.removeProperty('--chat-viewport-height'); element?.style.removeProperty('--chat-viewport-top'); };
  }, [fullscreen]);

  useEffect(() => {
    const profile: ChatProfile = conversation?.profile || {};
    setLead(previous => ({ ...previous, name: previous.name || profile.name || '', email: previous.email || profile.email || '', phone: previous.phone || profile.phone || '', company: previous.company || profile.company || '', goal: previous.goal || profile.interest || '', message: previous.message || conversation?.messages.filter(message => message.role === 'user').at(-1)?.text.slice(0, 2000) || '' }));
  }, [conversation]);

  useEffect(() => { if (scroll.current && stickToBottom.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [conversation, optimistic, busy, tab, open]);

  function close() { if (embedded) { setMinimized(true); window.requestAnimationFrame(() => launcher.current?.focus()); } else { setOpen(false); launcher.current?.focus(); } }
  async function start(nextTab: 'chat' | 'contact') {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const data = await chatRequest({ action: 'start', consent: true, remember, fresh: true });
      setConversation(data.conversation || null); setMinimized(false); setConfig(data.config || defaults); setTab(nextTab);
      if (nextTab === 'chat' && input.trim().length >= 2 && data.conversation && data.config?.aiAvailable) {
        inFlight.current = false;
        await send(input, undefined, data.conversation);
      }
    }
    catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível iniciar.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function send(text: string, requestId?: string, activeConversation = conversation) {
    if (inFlight.current || text.trim().length < 2 || !activeConversation) return;
    const id = requestId || window.crypto.randomUUID();
    inFlight.current = true; setBusy(true); setError(''); setFailed(null); setInput(''); stickToBottom.current = true;
    setOptimistic({ id: id + '-user', role: 'user', text: text.trim(), createdAt: new Date().toISOString() });
    try {
      const data = await chatRequest({ action: 'send', requestId: id, message: text.trim(), source: pathname, leadConsent: true });
      setConversation(data.conversation || null); setOptimistic(null); setHandoffSuggested(data.reply?.handoff === true); if (data.leadCaptureError) setError(data.leadCaptureError);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível obter uma resposta.'); setFailed({ id, text: text.trim() }); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const data = await chatRequest({ action: 'lead', lead, consent, source: pathname }); setConversation(data.conversation || null); }
    catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível guardar o pedido.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function retryLead() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const data = await chatRequest({ action: 'retryLead' }); setConversation(data.conversation || null); }
    catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível enviar o pedido.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function memoryPreference(enabled:boolean){
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
    try{const data=await chatRequest({action:'remember',enabled});setConversation(data.conversation||null);}catch(e){setError(e instanceof Error?e.message:'Falha ao guardar a preferencia.');}finally{inFlight.current=false;setBusy(false);}
  }
  async function newConversation(){
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
    try{const data=await chatRequest({action:'restart'});setConversation(data.conversation||null);setLead(initialLead);setConsent(false);setOptimistic(null);setFailed(null);setHandoffSuggested(false);setTab('chat');}catch(e){setError(e instanceof Error?e.message:'Falha ao iniciar a conversa.');}finally{inFlight.current=false;setBusy(false);}
  }
  function download() {
    if (!conversation) return;
    const text = ['Atendimento UPsoluti', ...conversation.messages.map(message => (message.role === 'user' ? 'Visitante' : 'Ana · UPsoluti') + ': ' + message.text)].join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'upsoluti-conversa.txt'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const messages = conversation?.messages || [];
  const visibleMessages = optimistic && !messages.some(message => message.id === optimistic.id) ? [...messages, optimistic] : messages;
  const directMail = 'mailto:contacto@upsoluti.com?subject=' + encodeURIComponent('Pedido de contacto — ' + (lead.company || 'Website')) + '&body=' + encodeURIComponent([lead.name, lead.email, lead.phone, lead.company, lead.message].filter(Boolean).join('\n'));

  const startAction = (initialized ? <><button className="chat-primary" aria-label={embedded ? input.trim().length >= 2 ? "Enviar mensagem" : "Conversar com a Ana" : undefined} disabled={busy} onClick={() => start('chat')}>{busy ? 'A iniciar…' : embedded ? input.trim().length >= 2 ? 'Enviar mensagem' : 'Conversar com a Ana' : 'Iniciar conversa'}<ArrowUpRight size={17} aria-hidden="true" /></button></> : <button className="chat-primary" onClick={() => { setInitialized(false); setOpen(false); window.setTimeout(() => setOpen(true), 0); }}>Tentar abrir novamente</button>);

  const captureNotice = !conversation?.leadStatus && <p className="chat-privacy-note">Ao enviar os seus dados de contacto nesta conversa, estes serão registados automaticamente com o contexto para a equipa dar seguimento ao atendimento. <Link href="/privacidade">Privacidade</Link>.</p>;

  const content = <div className={"public-chat" + (embedded ? " chat-embedded" : "") + (fullscreen ? " chat-mobile-fullscreen" : "")}>
    {embedded && mobile && conversation && minimized && <button ref={launcher} type="button" className="chat-primary chat-expand" onClick={() => setMinimized(false)}>Abrir conversa em ecrã inteiro<ArrowUpRight size={17} aria-hidden="true" /></button>}
    {open && <section ref={panel} id="upsoluti-chat" role={!embedded || fullscreen ? "dialog" : "region"} aria-modal={fullscreen ? true : undefined} aria-label="Atendimento UPsoluti" className="chat-panel">
      <header className="chat-header"><div className="chat-brand-icon"><Sparkles size={22} aria-hidden="true" /></div><div className="chat-heading"><h2>Ana · UPsoluti</h2><p>{embedded ? 'Assistente virtual com IA' : config.aiAvailable ? 'Atendente virtual · Como podemos ajudar?' : 'Atendimento · Vamos conversar?'}</p></div>{(!embedded || fullscreen) && <button className="chat-close chat-icon-button" onClick={close} aria-label={embedded ? "Minimizar conversa" : "Fechar atendimento"}><X size={20} aria-hidden="true" /></button>}</header>
      {conversation && <div className="chat-toolbar"><div className="chat-tabs" role="tablist" aria-label="Opções de atendimento" onKeyDown={event => { if (!(event.target instanceof HTMLElement) || event.target.getAttribute("role") !== "tab" || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? "chat" : event.key === "End" ? "contact" : tab === "chat" ? "contact" : "chat"; setTab(next); setError(''); document.getElementById(next === "chat" ? "chat-tab-conversation" : "chat-tab-contact")?.focus(); }}><button id="chat-tab-conversation" role="tab" aria-controls="chat-conversation" aria-selected={tab === 'chat'} tabIndex={tab === 'chat' ? 0 : -1} onClick={() => { setTab('chat'); setError(''); }}>Conversa</button><button id="chat-tab-contact" role="tab" aria-controls="chat-contact" aria-selected={tab === 'contact'} tabIndex={tab === 'contact' ? 0 : -1} onClick={() => { setTab('contact'); setError(''); }}>Falar com a equipa</button><div className="chat-history-actions"><button className="chat-icon-button" disabled={busy || !messages.length} onClick={download} aria-label="Baixar conversa"><Download size={15} aria-hidden="true" /></button></div></div>
      <div className="chat-memory-controls"><label><input type="checkbox" checked={conversation.profile.memoryEnabled===true} disabled={busy} onChange={e=>memoryPreference(e.target.checked)}/><span>Usar contexto em novas conversas neste navegador</span></label><button type="button" disabled={busy} onClick={newConversation}>Nova conversa</button>{!!conversation.profile.memoryNotes?.length&&conversation.profile.memoryEnabled&&<p>Contexto anterior retomado. Pode desativar a memória.</p>}</div></div>}
      {conversation && <div className="chat-capture-status">{captureNotice}{conversation.leadStatus && <p role="status">{conversation.leadStatus === 'synced' ? 'Dados e contexto enviados à equipa.' : 'Pedido guardado. O envio à equipa ainda está pendente.'}</p>}{conversation.leadStatus === 'pending' && <button type="button" className="chat-text-button" disabled={busy} onClick={retryLead}>Reenviar dados e contexto</button>}</div>}
      {booting ? <div className="chat-loading" role="status"><LoaderCircle size={22} aria-hidden="true" />A preparar o atendimento…</div> : !conversation ? <div className="chat-welcome">{embedded ? <><label className="consultor-input-label" htmlFor="consultor-first-message">Como podemos ajudar?</label><textarea className="consultor-first-message" id="consultor-first-message" rows={2} maxLength={1500} value={input} onChange={event => setInput(event.target.value)} placeholder="Conte-nos o que gostaria de melhorar no seu negócio…" disabled={busy || !initialized} />{startAction}<details className="consultor-examples"><summary>Precisa de uma ideia para começar?</summary><div className="consultor-suggestions" aria-label="Sugestões de perguntas">{suggestions.slice(0, 3).map(suggestion => <button type="button" key={suggestion} disabled={busy || !initialized} onClick={() => { setInput(suggestion); document.getElementById('consultor-first-message')?.focus(); }}>{suggestion}<ArrowUpRight size={13} aria-hidden="true" /></button>)}</div></details></> : <><span className="chat-welcome-icon"><Bot size={32} aria-hidden="true" /></span><h3>O seu próximo passo começa aqui.</h3><p>Conheça os serviços, explore uma ideia ou prepare um pedido para a nossa equipa.</p><ul><li><Check size={15} aria-hidden="true" />Marketing, software e automação</li><li><Check size={15} aria-hidden="true" />IA aplicada ao seu negócio</li><li><Check size={15} aria-hidden="true" />Contacto com a equipa</li></ul></>}{embedded ? <>{captureNotice}<details className="consultor-options"><summary>Privacidade e preferências</summary><p className="chat-privacy-note">Ao iniciar, a conversa será guardada por até {config.retentionDays} dias neste atendimento. As mensagens podem ser processadas pelo nosso provedor de IA. Pode baixar o histórico. <Link href="/privacidade" onClick={close}>Saiba mais</Link>.</p><label className="chat-consent"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Permitir usar o meu contexto em novas conversas neste navegador. Opcional; pode desativar.</span></label></details></> : <><p className="chat-privacy-note">Ao iniciar, a conversa será guardada por até {config.retentionDays} dias neste atendimento. As mensagens podem ser processadas pelo nosso provedor de IA. Pode baixar o histórico. <Link href="/privacidade" onClick={close}>Saiba mais</Link>.</p>{captureNotice}<label className="chat-consent"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Permitir usar o meu contexto em novas conversas neste navegador. Opcional; pode desativar.</span></label></>}{!embedded && startAction}<button className="chat-text-button" disabled={busy} onClick={() => start('contact')}>{embedded ? 'Prefiro falar com a equipa' : 'Prefiro deixar um pedido de contacto'}</button>{error && <p className="chat-error" role="alert">{error}</p>}<a className="chat-email" href="mailto:contacto@upsoluti.com"><Mail size={15} aria-hidden="true" />contacto@upsoluti.com</a></div> : <>
        {tab === 'chat' && <div role="tabpanel" aria-labelledby="chat-tab-conversation" id="chat-conversation" className="chat-conversation-panel"><div className="chat-messages" ref={scroll} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Mensagens do atendimento" onScroll={event => { const el = event.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; }}><div className="chat-message assistant"><span className="chat-message-author">Ana</span><p>{conversation.profile.name ? `Olá! Sou a Ana, atendente virtual da UPsoluti. Como posso ajudar hoje?` : anaGreeting}</p></div>{!config.aiAvailable && <div className="chat-availability"><p>A conversa IA está indisponível neste momento. Pode deixar um pedido ou falar diretamente por e-mail.</p><button className="chat-text-button" onClick={() => setTab('contact')}>Deixar pedido de contacto</button></div>}{visibleMessages.map(message => { const service = services.find(item => item.href === '/servicos/' + message.serviceSlug); return <div key={message.id} className={'chat-message ' + message.role}><span className="chat-message-author">{message.role === 'user' ? 'Você' : 'Ana · UPsoluti'}</span><p>{message.role === 'assistant' ? withoutManualConfirmation(message.text) : message.text}</p>{service && message.role === 'assistant' && <Link className="chat-source" href={service.href} onClick={close}>{service.label}<ArrowUpRight size={13} aria-hidden="true" /></Link>}</div>; })}{!messages.length && config.aiAvailable && <div className="chat-suggestions">{suggestions.map(suggestion => <button key={suggestion} disabled={busy} onClick={() => send(suggestion)}>{suggestion}<ArrowUpRight size={13} aria-hidden="true" /></button>)}</div>}{busy && <div className="chat-typing" role="status"><span /><span /><span /><span className="sr-only">A preparar uma resposta</span></div>}{(error || failed) && <div className="chat-error" role="alert"><p>{error || "A última mensagem ficou sem resposta. Pode tentar novamente."}</p>{failed && config.aiAvailable && <button className="chat-text-button" disabled={busy} onClick={() => send(failed.text, failed.id)}>Tentar novamente</button>}<button className="chat-text-button" onClick={() => { setTab('contact'); setError(''); }}>Continuar com a equipa</button></div>}{handoffSuggested && <button className="chat-handoff" onClick={() => setTab('contact')}>Preparar pedido para a equipa<ArrowUpRight size={15} aria-hidden="true" /></button>}</div><form className="chat-composer" onSubmit={event => { event.preventDefault(); send(input); }}><label htmlFor="upsoluti-chat-message" className="sr-only">A sua mensagem</label><textarea id="upsoluti-chat-message" value={input} onChange={event => setInput(event.target.value)} rows={2} maxLength={1500} placeholder="Descreva o desafio da sua empresa ou faça uma pergunta técnica..." disabled={busy || !config.aiAvailable || !!failed} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (input.trim().length >= 2) send(input); } }} /><button type="submit" disabled={busy || !config.aiAvailable || !!failed || input.trim().length < 2} aria-label="Enviar mensagem"><Send size={18} aria-hidden="true" /></button></form><p className="chat-footnote">Atendimento com IA. Para decisões e propostas, fale com a equipa.</p></div>}
        {tab === 'contact' && <div role="tabpanel" aria-labelledby="chat-tab-contact" id="chat-contact" className="chat-contact-panel">{conversation.leadStatus ? <div className="chat-lead-result" role="status"><span className="chat-result-icon"><Check size={25} aria-hidden="true" /></span><h3>{conversation.leadStatus === 'synced' ? 'Pedido enviado à equipa.' : 'Pedido guardado neste atendimento.'}</h3><p>{conversation.leadStatus === 'synced' ? 'A equipa recebeu o contexto e os contactos para dar seguimento ao seu pedido.' : 'O pedido ainda não foi enviado à equipa. Para atendimento direto, envie-o por e-mail através do botão abaixo.'}</p>{conversation.leadStatus === 'pending' && <button className="chat-primary" disabled={busy} onClick={retryLead}>{busy ? 'A enviar…' : 'Tentar enviar novamente'}</button>}{error && <p className="chat-error" role="alert">{error}</p>}<a className="chat-primary" href={directMail}><Mail size={16} aria-hidden="true" />{conversation.leadStatus === 'synced' ? 'Falar por e-mail' : 'Enviar pedido por e-mail'}</a>{config.bookingUrl && <a className="chat-secondary" href={config.bookingUrl} target="_blank" rel="noopener noreferrer">Escolher um horário<ArrowUpRight size={16} aria-hidden="true" /></a>}<p className="chat-footnote">A marcação de reunião só fica confirmada no serviço de agendamento.</p></div> : <><h3>Vamos conhecer a sua necessidade.</h3><p className="chat-contact-intro">Confirme os dados e o contexto que pretende partilhar com a equipa.</p><form className="chat-lead-form" onSubmit={submitLead}><fieldset disabled={busy}><div className="chat-field"><label htmlFor="chat-lead-name">Nome *</label><input id="chat-lead-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={lead.name} onChange={event => setLead({ ...lead, name: event.target.value })} /></div><div className="chat-field"><label htmlFor="chat-lead-email">E-mail *</label><input id="chat-lead-email" name="email" type="email" autoComplete="email" required maxLength={254} value={lead.email} onChange={event => setLead({ ...lead, email: event.target.value })} /></div><div className="chat-field"><label htmlFor="chat-lead-phone">Telefone <span>(opcional)</span></label><input id="chat-lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} value={lead.phone} onChange={event => setLead({ ...lead, phone: event.target.value })} /></div><div className="chat-field"><label htmlFor="chat-lead-company">Empresa *</label><input id="chat-lead-company" name="company" autoComplete="organization" required minLength={2} maxLength={150} value={lead.company} onChange={event => setLead({ ...lead, company: event.target.value })} /></div><div className="chat-field"><label htmlFor="chat-lead-goal">Principal interesse *</label><select id="chat-lead-goal" name="goal" required value={lead.goal} onChange={event => setLead({ ...lead, goal: event.target.value })}><option value="">Selecione</option>{goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="chat-field"><label htmlFor="chat-lead-timing">Quando pretende avançar?</label><select id="chat-lead-timing" name="timing" value={lead.timing} onChange={event => setLead({ ...lead, timing: event.target.value })}><option value="exploring">Estou a explorar possibilidades</option><option value="quarter">Nos próximos três meses</option><option value="immediate">Assim que possível</option></select></div><div className="chat-field"><label htmlFor="chat-lead-budget">Investimento previsto</label><select id="chat-lead-budget" name="budget" value={lead.budget} onChange={event => setLead({ ...lead, budget: event.target.value })}>{budgets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="chat-field"><label htmlFor="chat-lead-context">O que pretende melhorar? *</label><textarea id="chat-lead-context" name="message" rows={3} required minLength={10} maxLength={2000} value={lead.message} onChange={event => setLead({ ...lead, message: event.target.value })} /></div><div className="honeypot" aria-hidden="true"><label htmlFor="chat-lead-website">Deixe vazio</label><input id="chat-lead-website" name="website" tabIndex={-1} autoComplete="off" value={lead.website} onChange={event => setLead({ ...lead, website: event.target.value })} /></div><label className="chat-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>Autorizo a UPsoluti a usar estes dados e esta conversa para responder ao pedido. <Link href="/privacidade" onClick={close}>Privacidade</Link>.</span></label><button type="submit" className="chat-primary">{busy ? 'A guardar…' : 'Confirmar pedido'}<ArrowUpRight size={17} aria-hidden="true" /></button></fieldset>{error && <p className="chat-error" role="alert">{error}</p>}</form></>}</div>}
      </>}
    </section>}
    {!embedded && <button ref={launcher} className={'chat-launcher' + (open ? ' is-open' : '')} aria-label={open ? 'Fechar atendimento' : 'Abrir atendimento UPsoluti'} aria-expanded={open} aria-controls="upsoluti-chat" onClick={() => setOpen(value => !value)}>{open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}<span>{open ? 'Fechar' : 'Vamos conversar?'}</span></button>}
  </div>;
  return embedded && fullscreen ? createPortal(content, document.body) : content;
}
