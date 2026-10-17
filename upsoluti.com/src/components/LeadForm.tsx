"use client";

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { track } from '@/lib/analytics';
import { budgets, goals } from '@/lib/lead-options';

export default function LeadForm({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const busy = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const selected = query.get('objetivo');
    if (goals.some(([key]) => key === selected)) setGoal(selected!);
    setContext(query.get('equipa') ? 'Dimensão da equipa: ' + query.get('equipa') : '');
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setStatus('loading');
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const query = new URLSearchParams(window.location.search);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, formKind: compact ? 'contact' : 'proposal', source: window.location.pathname, utm_source: query.get('utm_source') || '', utm_medium: query.get('utm_medium') || '', utm_campaign: query.get('utm_campaign') || '', origin: query.get('origem') || '' }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(response.status === 429
        ? 'Foram enviados vários pedidos. Aguarde alguns minutos antes de tentar novamente.'
        : response.status === 400 ? 'Verifique os campos e tente novamente.'
        : 'Não foi possível enviar o pedido. Tente novamente ou escreva para contacto@upsoluti.com.');
      setStatus('success');
      track('lead_submitted', { form: compact ? 'contact' : 'proposal', goal });
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error && error.name !== 'AbortError' ? error.message : 'O envio demorou mais do que o esperado. Os seus dados continuam no formulário; tente novamente.');
    } finally {
      clearTimeout(timeout);
      busy.current = false;
    }
  }

  if (status === 'success') return (
    <div className="proposal-success" role="status">
      <h3>Pedido recebido com sucesso</h3>
      <p>A sua mensagem foi entregue à nossa equipa. Entraremos em contacto através do e-mail indicado.</p>
      {process.env.NEXT_PUBLIC_BOOKING_URL && <a className="btn-primary mt-6" href={process.env.NEXT_PUBLIC_BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('booking_clicked')}>Escolher um horário para conversar</a>}
    </div>
  );

  return (
    <form onSubmit={submit} className="proposal-form" aria-busy={status === 'loading'}>
      <fieldset disabled={status === 'loading'} className="proposal-fields">
        <legend className="sr-only">{compact ? 'Contacto inicial' : 'Pedido de proposta'}</legend>
        <div className="proposal-field"><label htmlFor={id + '-name'}>Nome completo *</label><input id={id + '-name'} name="name" autoComplete="name" required minLength={2} maxLength={100} /></div>
        <div className="proposal-row">
          <div className="proposal-field"><label htmlFor={id + '-email'}>E-mail profissional *</label><input id={id + '-email'} name="email" type="email" autoComplete="email" required maxLength={254} /></div>
          {!compact && <div className="proposal-field"><label htmlFor={id + '-phone'}>Telefone <span>(opcional)</span></label><input id={id + '-phone'} name="phone" type="tel" autoComplete="tel" maxLength={40} pattern="[\+0-9\(\) .\-]{7,40}" title="Indique um telefone com pelo menos 7 caracteres, usando números e, se necessário, +, espaços, pontos, parênteses ou hífen." /></div>}
        </div>
        {!compact && <>
          <div className="proposal-row">
            <div className="proposal-field"><label htmlFor={id + '-company'}>Empresa *</label><input id={id + '-company'} name="company" autoComplete="organization" required minLength={2} maxLength={150} /></div>
            <div className="proposal-field"><label htmlFor={id + '-url'}>Website <span>(opcional)</span></label><input id={id + '-url'} name="companyWebsite" inputMode="url" autoComplete="url" placeholder="www.empresa.pt" maxLength={500} /></div>
          </div>
        </>}
        <div className="proposal-field"><label htmlFor={id + '-goal'}>Em que podemos ajudar? *</label><select id={id + '-goal'} name="goal" required value={goal} onChange={event => setGoal(event.target.value)}><option value="">Selecione um serviço</option>{goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        {!compact && <div className="proposal-field"><label htmlFor={id + '-budget'}>Investimento previsto para o projeto *</label><select id={id + '-budget'} name="budget" required defaultValue=""><option value="">Selecione uma faixa</option>{budgets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="proposal-hint">Uma indicação inicial para alinharmos o âmbito. Não é um compromisso de contratação.</p></div>}
        <div className="proposal-field"><label htmlFor={id + '-message'}>Fale-nos do seu projeto *</label><textarea id={id + '-message'} name="message" rows={4} required minLength={10} maxLength={4000} value={context} onChange={event => setContext(event.target.value)} /></div>
        <div className="honeypot" aria-hidden="true"><label htmlFor={id + '-website'}>Deixe este campo vazio</label><input id={id + '-website'} name="website" tabIndex={-1} autoComplete="off" /></div>
        <button type="submit" className="proposal-submit">{status === 'loading' ? 'A enviar…' : compact ? 'Vamos conversar' : 'Pedir proposta'}<ArrowRight size={18} aria-hidden="true" /></button>
        <p className="proposal-privacy">Usaremos os dados para responder ao seu pedido. Consulte a nossa <Link href="/privacidade">informação de privacidade</Link>.</p>
      </fieldset>
      {status === 'error' && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
