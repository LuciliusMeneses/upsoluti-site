import Link from 'next/link';
import { ArrowUpRight, Mail, Sparkles } from 'lucide-react';
import LeadForm from './LeadForm';

export default function ContactForm() {
  return (
    <section className="growth-contact" id="proposta" aria-labelledby="proposal-title">
      <div className="growth-contact-glow" aria-hidden="true" />
      <div className="container-main growth-contact-grid">
        <div className="growth-contact-intro">
          <p className="growth-eyebrow"><Sparkles size={14} aria-hidden="true" />O próximo passo é seu</p>
          <h2 id="proposal-title">Vamos <span>trabalhar juntos?</span></h2>
          <p className="ai-contact-description">Uma ideia, um desafio ou uma oportunidade.<br />Vamos encontrar o melhor caminho.</p>
          <a className="growth-contact-email" href="mailto:contacto@upsoluti.com"><Mail size={18} aria-hidden="true" />contacto@upsoluti.com</a>
          <Link className="ai-contact-detail-link" href="/contacto">Prefere detalhar o projeto? <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="growth-proposal-card">
          <h3>Conte-nos o essencial.</h3>
          <LeadForm compact />
        </div>
      </div>
    </section>
  );
}
