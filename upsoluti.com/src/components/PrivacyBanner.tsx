'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { CONSENT_KEY, readConsent } from '@/lib/consent';
export default function PrivacyBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { const choice = readConsent(); setOpen(!choice); setAnalytics(choice?.analytics || false); const sync = () => { const c = readConsent(); setOpen(!c); setAnalytics(c?.analytics || false); }; const manage = () => { setAnalytics(readConsent()?.analytics || false); setDetails(true); setOpen(true); requestAnimationFrame(() => heading.current?.focus()); }; window.addEventListener('storage', sync); window.addEventListener('upsoluti:privacy-open', manage); return () => { window.removeEventListener('storage', sync); window.removeEventListener('upsoluti:privacy-open', manage); }; }, []);
  function save(value: boolean) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, analytics: value, savedAt: Date.now() })); setAnalytics(value); setOpen(false); setDetails(false); setError(''); window.dispatchEvent(new Event('upsoluti:consent')); trigger.current?.focus(); }
    catch { setError('O navegador não permitiu guardar a escolha. A medição opcional permanece desativada.'); }
  }
  return <><button ref={trigger} type="button" className="privacy-settings" onClick={() => { setAnalytics(readConsent()?.analytics || false); setDetails(true); setOpen(true); requestAnimationFrame(() => heading.current?.focus()); }} aria-expanded={open} aria-controls="privacy-banner"><ShieldCheck size={15} aria-hidden="true" />Privacidade</button>{open && <section id="privacy-banner" className={"privacy-banner" + (details ? " privacy-banner-expanded" : "")} role="region" aria-labelledby="privacy-title"><div className="privacy-copy"><div className="privacy-kicker"><ShieldCheck size={14} aria-hidden="true" /> PRIVACIDADE POR ESCOLHA</div><h2 id="privacy-title" ref={heading} tabIndex={-1}>O controlo fica consigo.</h2><p>Apenas o essencial por defeito. Autorize a medição de interações se desejar — pode mudar de ideia a qualquer momento. <Link href="/politicas">Conhecer as políticas <ArrowUpRight size={12} aria-hidden="true" /></Link></p>{details && <div className="privacy-options"><div><strong>Necessários <span>Sempre ativos</span></strong><p>Preferências por 180 dias e identificação da conversa iniciada por si, pelo prazo indicado no chat.</p></div><label><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /><span><strong>Medição de interações</strong><small>Eventos locais no navegador, sem envio para plataformas externas. Desativada por defeito.</small></span></label><p>Sem ferramentas de publicidade instaladas. Pode alterar ou retirar a autorização em “Privacidade”, no canto inferior.</p></div>}{error && <p role="alert">{error}</p>}</div><div className="privacy-actions"><button type="button" onClick={() => save(false)}>Recusar opcionais</button><button type="button" onClick={() => save(true)}>Aceitar todos</button>{details ? <button type="button" onClick={() => save(analytics)}>Guardar preferências</button> : <button type="button" onClick={() => setDetails(true)}><SlidersHorizontal size={13} aria-hidden="true" />Personalizar</button>}</div></section>}</>;
}
