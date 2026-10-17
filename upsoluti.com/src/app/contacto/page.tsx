import { Mail, CalendarDays } from 'lucide-react';
import LeadForm from '@/components/LeadForm';
import PageHeader from '@/components/PageHeader';
import { ProcessSteps } from '@/components/InnerUI';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Vamos conversar', 'Conte-nos o seu desafio em marketing, software, automação ou inteligência artificial.', '/contacto');
export default function ContactPage() {
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL;
  return <main className="inner-page">
    <PageHeader breadcrumb="Contacto" title="Uma conversa." highlight="Novas possibilidades." subtitle="Conte-nos o que pretende melhorar. Vamos perceber o contexto e encontrar um ponto de partida para o seu projeto." />
    <section className="inner-section"><div className="container-main inner-split inner-contact-layout"><aside className="inner-contact-aside"><p className="inner-eyebrow">O que acontece a seguir</p><ProcessSteps steps={[{ title: 'Partilhe o contexto', desc: 'O objetivo, os desafios e o que já utiliza.' }, { title: 'Alinhamos a prioridade', desc: 'Esclarecemos o pedido e identificamos uma primeira necessidade.' }, { title: 'Definimos um caminho', desc: 'Âmbito, entregas e investimento são acordados antes de avançar.' }]} /><a className="inner-email" href="mailto:contacto@upsoluti.com"><Mail size={18} aria-hidden="true" />contacto@upsoluti.com</a><p>Lisboa, Portugal · Atendimento remoto</p>{booking && <a className="inner-button" style={{ marginTop: 24 }} href={booking} target="_blank" rel="noopener noreferrer" data-booking-link><CalendarDays size={17} aria-hidden="true" />Escolher um horário</a>}</aside><div className="inner-panel inner-form-panel" id="pedido"><h2>Vamos conhecer o seu projeto.</h2><LeadForm /></div></div></section>
  </main>;
}
