import Link from 'next/link';
import { ArrowRight, CalendarDays, Bot, Code2, Workflow, TrendingUp } from 'lucide-react';

const capabilities = [
  { icon: TrendingUp, label: 'Marketing e vendas' },
  { icon: Code2, label: 'Websites e software' },
  { icon: Workflow, label: 'Automação de processos' },
  { icon: Bot, label: 'Inteligência artificial' },
];

// Preserve the GrowthClick-inspired hero composition when simplifying the home.
export default function HeroSection() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

  return (
    <section className="growth-hero" aria-labelledby="growth-hero-title">
      <div className="growth-orbit growth-orbit-left" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="growth-orbit growth-orbit-right" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="container-main growth-hero-inner">
        <p className="growth-eyebrow">Marketing, tecnologia e IA para o seu negócio</p>
        <h1 id="growth-hero-title">Transforme o potencial da sua empresa em <span>crescimento real.</span></h1>
        <p className="growth-hero-description">Atraia clientes, simplifique processos e dê o próximo passo com marketing, software e inteligência artificial a trabalhar em conjunto.</p>
        <div className="growth-hero-actions">
          <Link className="growth-button growth-button-primary" href="#proposta">Pedir uma proposta <ArrowRight size={19} aria-hidden="true" /></Link>
          {bookingUrl ? (
            <a className="growth-button growth-button-outline" href={bookingUrl} target="_blank" rel="noopener noreferrer" data-booking-link><CalendarDays size={18} aria-hidden="true" />Agendar uma conversa</a>
          ) : (
            <Link className="growth-button growth-button-outline" href="/contacto"><CalendarDays size={18} aria-hidden="true" />Agendar uma conversa</Link>
          )}
        </div>
        <p className="growth-hero-note"><span aria-hidden="true" />Uma estratégia clara. As ferramentas certas. Um parceiro próximo.</p>
        <ul className="growth-capabilities" aria-label="Áreas de atuação">
          {capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={21} aria-hidden="true" /><span>{label}</span></li>)}
        </ul>
      </div>
    </section>
  );
}
