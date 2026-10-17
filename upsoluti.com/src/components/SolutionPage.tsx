import { ArrowRight, TrendingUp, Workflow, Bot } from 'lucide-react';
import PageHeader from './PageHeader';
import AnimatedDiagram from './AnimatedDiagram';
import { diagramForGoal } from '@/lib/diagrams';
import { CheckList, SectionHeading, InfoCard, FAQList, PageCTA } from './InnerUI';
import { solutionData, type SolutionSlug } from '@/lib/solutions';
import { getService } from '@/lib/services';
import { services as navigation } from '@/lib/navigation';

const icons = [TrendingUp, Workflow, Bot];
export default function SolutionPage({ slug }: { slug: SolutionSlug }) {
  const solution = solutionData[slug];
  const contact = '/contacto?objetivo=' + slug + '&origem=' + slug;
  return <main className="inner-page">
    <PageHeader breadcrumb={solution.name} title={solution.title} highlight={solution.highlight} subtitle={solution.description} cta={{ label: 'Explorar a minha necessidade', href: contact }} />
    <section className="inner-section"><div className="container-main inner-split"><div className="inner-copy"><p className="inner-eyebrow">Reconhece estes sinais?</p><h2>Começamos pelo que precisa de mudar.</h2><CheckList items={solution.signs} /></div><div className="inner-panel"><p className="inner-eyebrow">A abordagem</p><h2>Um primeiro passo com sentido.</h2><p>{solution.overview}</p></div></div></section>
    <section className="inner-section"><div className="container-main inner-example-grid"><div className="inner-panel"><p className="inner-eyebrow">Um exemplo de aplicação</p><h2>{solution.exampleTitle}</h2><div className="inner-flow">{solution.flow.map((step, index) => <div key={step} className="inner-flow-item"><span>{step}</span>{index < solution.flow.length - 1 && <ArrowRight size={17} aria-hidden="true" />}</div>)}</div><p>{solution.example}</p></div><AnimatedDiagram variant={diagramForGoal(slug)} /></div></section>
    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="As peças da solução" title="Escolhemos o que faz falta." description="Os serviços podem ser combinados de acordo com o diagnóstico, sem começar por tudo ao mesmo tempo." /><div className="inner-grid inner-grid-three">{solution.services.map((id, index) => { const service = getService(id)!; const label = navigation.find(item => item.href.endsWith('/' + id))!.label; return <InfoCard key={id} icon={icons[index]} title={label} description={service.description} href={'/servicos/' + id} label="Conhecer o serviço" />; })}</div></div></section>
    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Dúvidas frequentes" title="Antes de dar o próximo passo." /><FAQList items={solution.faqs} /></div></section>
    <PageCTA title="O que gostaria de melhorar primeiro?" description="Conte-nos o contexto. A prioridade, o âmbito e o investimento são definidos consigo." href={contact} label="Pedir um diagnóstico" />
  </main>;
}
