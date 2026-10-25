import Link from 'next/link';
import { ArrowUpRight, Code2, Workflow, TrendingUp, Sparkles } from 'lucide-react';
import ChatWidget from '@/components/ChatWidget';

const capabilities = [
  { icon: TrendingUp, label: 'Marketing e vendas' },
  { icon: Code2, label: 'Software à medida' },
  { icon: Workflow, label: 'Automação e CRM' },
  { icon: Sparkles, label: 'Inteligência artificial' },
];

export default function HeroSection() {
  return (
    <section className="growth-hero consultor-hero" aria-labelledby="growth-hero-title">
      <div className="container-main growth-hero-inner">
        <p className="growth-eyebrow"><Sparkles size={14} aria-hidden="true" />Inteligência aplicada. Negócios preparados.</p>
        <h1 id="growth-hero-title">Transformamos desafios empresariais em <span>soluções inteligentes.</span></h1>
        <p className="growth-hero-description">Combinamos Inteligência Artificial, software, automação e estratégia digital para tornar o seu negócio mais eficiente, competitivo e preparado para o futuro.</p>
        <aside className="site-crm-callout" aria-labelledby="site-crm-title">
          <div className="site-crm-copy">
            <p className="site-crm-label">Em destaque · Site + CRM</p>
            <h2 id="site-crm-title">Da primeira visita ao acompanhamento comercial.</h2>
            <p>Um site para apresentar o seu negócio e um CRM para organizar contactos e oportunidades. Descubra a solução para a sua empresa.</p>
          </div>
          <Link className="site-crm-cta" href="/contacto?origem=home-site-crm&objetivo=software">Quero conhecer <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </aside>
        <ChatWidget embedded />
        <div className="consultor-next"><span>Da primeira pergunta à solução certa.</span><Link href="#solucoes">Explore as nossas soluções <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        <ul className="growth-capabilities" aria-label="Áreas de atuação">
          {capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={19} aria-hidden="true" /><span>{label}</span></li>)}
        </ul>
      </div>
    </section>
  );
}
