import { useState, type FormEvent } from 'react';
import { ChevronLeft, Flower2 } from 'lucide-react';
import { copy, type Locale } from './domain';
import { supabase } from './api';
import { emailEnabled } from './features';

export default function Auth({locale, onBack, recovery, onRecovered, ready = true}: {
  locale: Locale; onBack: () => void; recovery: boolean;
  onRecovered: () => void; ready?: boolean;
}) {
  const t = copy[locale];
  const [step, setStep] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pt = locale === 'pt-PT';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy || !ready) return;
    if (!emailEnabled && (recovery || step !== 'login')) {
      setMessage('Envio de e-mail desativado neste ambiente de teste.');
      return;
    }
    if ((recovery || step === 'signup') && password !== confirmation) {
      setMessage(pt ? 'As palavras-passe não coincidem.' : 'As senhas não coincidem.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        onRecovered();
      } else if (step === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/reset`,
        });
        if (error) throw error;
        setMessage('Pedido aceite. Se a conta existir e o envio estiver disponível, receberá instruções por e-mail.');
      } else if (step === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        }});
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        setMessage('Pedido de cadastro aceite. Verifique o e-mail para confirmar a conta. O recebimento depende do serviço de envio.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setPassword('');
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(code === 'email_not_confirmed'
        ? 'Confirme o e-mail da conta antes de entrar.'
        : code === 'over_email_send_rate_limit' || code === 'email_address_not_authorized'
          ? 'O serviço de e-mail ainda não permite este envio. Configure o SMTP do estabelecimento ou tente mais tarde.'
          : recovery ? 'Não foi possível alterar a senha. O link pode ter expirado; solicite uma nova recuperação.'
            : 'Não foi possível concluir. Verifique os dados e tente novamente.');
    } finally { setBusy(false); }
  }

  function changeStep(next: typeof step) {
    setStep(next); setPassword(''); setConfirmation(''); setMessage('');
  }
  return <main className="auth-card">
    <div className="brand-icon"><Flower2 size={34}/></div>
    <span className="eyebrow">AURA · GESTÃO DE ESTÉTICA</span>
    <h1>{recovery ? (pt ? 'Nova palavra-passe' : 'Nova senha') : step === 'reset' ? t.recover : step === 'signup' ? 'Criar conta' : t.login}</h1>
    <p>O seu negócio, organizado com cuidado.</p>
    {!emailEnabled && <div className="notice" role="status">Ambiente de teste sem envio de e-mails. Utilize uma conta de teste fornecida pelo responsável.</div>}
    {!supabase && <div className="notice">{t.config}. Configure as variáveis Supabase para autenticar. A demonstração continua disponível.</div>}
    {!ready && <p role="status">{pt ? 'A verificar a sessão…' : 'Verificando a sessão…'}</p>}
    {recovery && !emailEnabled ? <p role="alert">A recuperação por e-mail está desativada durante os testes. Solicite ao responsável a reposição do acesso de teste.</p> : <form onSubmit={submit}>
      {!recovery && <label>E-mail<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy}/></label>}
      {(step !== 'reset' || recovery) && <label>{t.password}<input required minLength={recovery || step === 'signup' ? 12 : 1} maxLength={200} type="password" autoComplete={recovery || step === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label>}
      {(recovery || step === 'signup') && <label>{pt ? 'Confirmar palavra-passe' : 'Confirmar senha'}<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/></label>}
      <button disabled={!supabase || busy || !ready} className="primary wide">{busy ? 'A processar…' : recovery ? t.save : step === 'reset' ? t.recover : step === 'signup' ? 'Criar conta' : t.login}</button>
    </form>}
    {message && <p className="auth-feedback" role="status">{message}</p>}
    {!recovery && emailEnabled && <div className="auth-links"><button disabled={busy} onClick={() => changeStep(step === 'reset' ? 'login' : 'reset')}>{step === 'reset' ? t.login : t.recover}</button><button disabled={busy} onClick={() => changeStep(step === 'signup' ? 'login' : 'signup')}>{step === 'signup' ? t.login : 'Criar conta'}</button></div>}
    <button disabled={busy} className="outline wide" onClick={onBack}><ChevronLeft size={16}/>{t.back} · {t.demo}</button>
    <footer>Powered by <a href="https://upsoluti.com">UPsoluti</a></footer>
  </main>;
}
