import Link from 'next/link';
import { ArrowUpRight, Code2, Workflow, TrendingUp, Sparkles, Globe2, Inbox, CheckCircle2 } from 'lucide-react';

const capabilities = [
  { icon: TrendingUp, label: 'Marketing e vendas' },
  { icon: Code2, label: 'Software à medida' },
  { icon: Workflow, label: 'Automação e CRM' },
  { icon: Sparkles, label: 'Inteligência artificial' },
];

export default function HeroSection() {
  return (
    <section className="business-hero" aria-labelledby="home-title">
      <div className="container-main business-hero-grid">
        <div className="business-hero-copy">
          <p className="ai-eyebrow"><Sparkles size={14} aria-hidden="true" />Tecnologia para pequenos negócios</p>
          <h1 id="home-title">Mais atenção aos clientes.<br /><span>Menos tarefas manuais.</span></h1>
          <p className="business-hero-description">Organize o atendimento e acompanhe as oportunidades de venda. Ligamos marketing, websites, CRM e automação às necessidades da sua empresa.</p>
          <div className="business-actions"><Link href="#proposta" className="business-primary">Pedir um diagnóstico <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href="#demonstracao" className="business-secondary">Ver uma demonstração <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <p className="business-hero-note">Começamos pelo seu desafio. O âmbito e o investimento são definidos em proposta.</p>
        </div>
        <div className="business-operation" aria-label="Exemplo de percurso entre website, pedido e acompanhamento comercial">
          <div className="business-operation-header"><span className="business-live-dot" />Uma operação com continuidade<Workflow size={18} aria-hidden="true" /></div>
          <p className="business-operation-title">O contacto chega.<br /><strong>A conversa continua.</strong></p>
          <ol className="business-operation-flow">
            <li><span className="business-flow-icon"><Globe2 size={21} aria-hidden="true" /></span><div><strong>Website</strong><p>Apresente a sua oferta e receba pedidos.</p></div><span className="business-flow-number">01</span></li>
            <li><span className="business-flow-icon"><Inbox size={21} aria-hidden="true" /></span><div><strong>Pedido organizado</strong><p>Reúna o contacto e o contexto necessário.</p></div><span className="business-flow-number">02</span></li>
            <li><span className="business-flow-icon"><CheckCircle2 size={21} aria-hidden="true" /></span><div><strong>Seguimento no CRM</strong><p>Acompanhe a oportunidade e o próximo passo.</p></div><span className="business-flow-number">03</span></li>
          </ol>
          <div className="business-operation-footer">Percurso ilustrativo · veja o exemplo funcional abaixo</div>
        </div>
      </div>
      <div className="container-main"><ul className="growth-capabilities business-capabilities" aria-label="Áreas de atuação">
          {capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={19} aria-hidden="true" /><span>{label}</span></li>)}
        </ul></div>
    </section>
  );
}
