import './home.css';
import Link from 'next/link';
import { ArrowUpRight, Bot, Code2, Workflow, TrendingUp, ChevronDown, Sparkles, ShieldCheck, Blocks, ScanLine } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import ContactForm from '@/components/ContactForm';
import QuickDiagnostic from '@/components/QuickDiagnostic';
import StructuredData from '@/components/StructuredData';
import { siteUrl } from '@/lib/site';

const steps = [
  { number: '01', title: 'Entender', description: 'Identificamos os processos, as limitações e a prioridade do seu negócio.' },
  { number: '02', title: 'Construir', description: 'Desenvolvemos a solução e ligamos as ferramentas à sua operação.' },
  { number: '03', title: 'Evoluir', description: 'Acompanhamos a utilização, medimos e melhoramos consigo.' },
];

export default function Home() {
  return (
    <main className="ai-home">
      <StructuredData data={{ '@context': 'https://schema.org', '@graph': [
        { '@type': 'Organization', '@id': siteUrl + '/#organization', name: 'UPsoluti', url: siteUrl + '/', logo: siteUrl + '/brand/upsoluti-symbol.png', email: 'contacto@upsoluti.com' },
        { '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: 'UPsoluti', inLanguage: 'pt-PT', publisher: { '@id': siteUrl + '/#organization' } },
      ] }} />
      <HeroSection />
      <section className="ai-solutions" id="solucoes" aria-labelledby="solutions-title">
        <div className="container-main">
          <div className="ai-section-heading">
            <div><p className="ai-eyebrow"><Sparkles size={14} aria-hidden="true" />Possibilidades conectadas</p><h2 id="solutions-title">Menos complexidade.<br /><span>Mais inteligência.</span></h2></div>
          </div>
          <div className="ai-bento">
            <Link href="/solucoes/escalar-ia" className="ai-tile ai-tile-featured">
              <div className="ai-tile-top"><span className="ai-icon"><Bot size={22} aria-hidden="true" /></span><span className="ai-tile-category">Inteligência artificial</span><ArrowUpRight className="ai-tile-arrow" size={21} aria-hidden="true" /></div>
              <div className="ai-core-visual" aria-hidden="true"><div className="ai-core-orbit orbit-one" /><div className="ai-core-orbit orbit-two" /><div className="ai-core-orbit orbit-three" /><div className="ai-core"><Sparkles size={36} /></div><span className="ai-core-node node-one" /><span className="ai-core-node node-two" /><span className="ai-core-node node-three" /><span className="ai-core-node node-four" /></div>
              <div className="ai-tile-copy"><h3>Uma nova capacidade<br />para a sua equipa.</h3><p>Assistentes que aproximam conhecimento, pessoas e ação.</p></div>
            </Link>
            <Link href="/solucoes/automatizar" className="ai-tile ai-tile-automation">
              <div className="ai-tile-top"><span className="ai-icon"><Workflow size={21} aria-hidden="true" /></span><span className="ai-tile-category">Automação</span><ArrowUpRight className="ai-tile-arrow" size={21} aria-hidden="true" /></div>
              <div className="ai-flow-visual" aria-hidden="true"><span /><i /><span /><i /><span /></div>
              <div className="ai-tile-copy"><h3>Tudo ligado. Menos tarefas.</h3><p>Processos que fluem entre os seus sistemas.</p></div>
            </Link>
            <Link href="/solucoes/vender-mais" className="ai-tile ai-tile-growth">
              <div className="ai-tile-top"><span className="ai-icon"><TrendingUp size={21} aria-hidden="true" /></span><ArrowUpRight className="ai-tile-arrow" size={21} aria-hidden="true" /></div>
              <div className="ai-tile-copy"><h3>Mais oportunidades.</h3><p>Marketing ligado às suas vendas.</p><span className="ai-tile-label">Marketing & Growth</span></div>
            </Link>
            <Link href="/servicos/software" className="ai-tile ai-tile-software">
              <div className="ai-tile-top"><span className="ai-icon"><Code2 size={21} aria-hidden="true" /></span><ArrowUpRight className="ai-tile-arrow" size={21} aria-hidden="true" /></div>
              <div className="ai-tile-copy"><h3>À sua medida.</h3><p>Websites e software para ir mais longe.</p><span className="ai-tile-label">Web & Software</span></div>
            </Link>
          </div>
        </div>
      </section>
      <section className="ai-process" aria-labelledby="process-title">
        <div className="container-main">
          <div className="ai-process-heading"><p className="ai-eyebrow">Da ideia à operação</p><h2 id="process-title">Um caminho simples.</h2></div>
          <ol className="ai-process-steps">{steps.map(step => <li key={step.number}><span className="ai-step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
          <details className="ai-diagnostic-disclosure"><summary><span><Sparkles size={17} aria-hidden="true" />Ainda não sabe por onde começar?</span><span className="ai-disclosure-action">Descubra a sua prioridade <ChevronDown size={17} aria-hidden="true" /></span></summary><div className="ai-diagnostic-content"><QuickDiagnostic /></div></details>
        </div>
      </section>
      <section className="ai-principles" aria-labelledby="principles-title">
        <div className="container-main">
          <p className="ai-eyebrow">Tecnologia com critério</p>
          <h2 id="principles-title">Pensada para a sua operação.</h2>
          <div className="ai-principles-grid">
            <article><ShieldCheck size={22} aria-hidden="true" /><h3>Segurança desde o início</h3><p>Permissões, privacidade e tratamento de dados fazem parte das decisões de projeto.</p></article>
            <article><Blocks size={22} aria-hidden="true" /><h3>Engenharia que conecta</h3><p>Software, CRM e automação integrados, com atenção à manutenção e à evolução.</p></article>
            <article><ScanLine size={22} aria-hidden="true" /><h3>Clareza para avançar</h3><p>Objetivos definidos, validação por etapas e acompanhamento próximo da equipa.</p></article>
          </div>
        </div>
      </section>
      <ContactForm />
    </main>
  );
}
