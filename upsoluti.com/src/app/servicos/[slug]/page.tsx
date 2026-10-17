import CrmShowcase from '@/components/CrmShowcase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Target, Layers, Workflow, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { getService, servicesData } from '@/lib/services';
import { pageMetadata } from '@/lib/site';
import PageHeader from '@/components/PageHeader';
import AnimatedDiagram from '@/components/AnimatedDiagram';
import { diagramForGoal } from '@/lib/diagrams';
import { SectionHeading, InfoCard, ProcessSteps, FAQList, CheckList, PageCTA } from '@/components/InnerUI';

const featureIcons = [Target, Layers, Workflow, ShieldCheck];
export function generateStaticParams() { return Object.keys(servicesData).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  return service ? pageMetadata(service.name, service.description, '/servicos/' + slug) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const contact = '/contacto?objetivo=' + service.goal + '&origem=' + slug;
  if (slug === 'software') return <main className="inner-page software-page">
    <PageHeader breadcrumb={service.name} title={service.title} highlight={service.highlight} subtitle={service.description} cta={{ label: 'Conversar sobre o meu projeto', href: contact }} />
    <CrmShowcase />
    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Construído com critério" title="Útil para a equipa. Claro para a gestão." description={service.overview} /><div className="inner-grid">{service.features.map((feature, index) => <InfoCard key={feature.title} title={feature.title} description={feature.desc} icon={featureIcons[index]} />)}</div></div></section>
    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Do primeiro desenho à utilização" title="Valide antes de avançar." /><ProcessSteps steps={service.steps} /><div className="software-faq"><FAQList items={service.faqs} /></div></div></section>
    <PageCTA title="Qual é o processo que precisa de simplificar?" description="Conte-nos como trabalha hoje. Definimos consigo o que construir primeiro." href={contact} />
  </main>;

  return (
    <main className="inner-page">
      <PageHeader breadcrumb={service.name} title={service.title} highlight={service.highlight} subtitle={service.description} cta={{ label: 'Falar sobre esta necessidade', href: contact }} />
      <section className="inner-section"><div className="container-main inner-split inner-service-intro">
        <div className="inner-copy"><p className="inner-eyebrow">O ponto de partida</p><h2>Uma solução alinhada com a sua realidade.</h2><p>{service.overview}</p><p className="inner-eyebrow">Faz sentido para si se…</p><CheckList items={service.idealFor} /></div>
        <AnimatedDiagram variant={diagramForGoal(service.goal)} />
      </div></section>
      <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="O que podemos construir" title="As peças do seu projeto." description="O âmbito final é definido no diagnóstico. Estas são as áreas que podemos combinar." /><div className="inner-grid">{service.features.map((feature, index) => <InfoCard key={feature.title} title={feature.title} description={feature.desc} icon={featureIcons[index % featureIcons.length]} />)}</div></div></section>
      <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Como avançamos" title="Clareza em cada etapa." /><ProcessSteps steps={service.steps} /></div></section>
      <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Antes de começar" title="As perguntas essenciais." /><FAQList items={service.faqs} /></div></section>
      <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Também se liga a" title="Outras peças do mesmo ecossistema." /><div className="inner-grid">{service.related.map(id => { const related = getService(id)!; return <Link key={id} className="inner-card inner-card-link" href={'/servicos/' + id}><div className="inner-card-top"><span className="inner-eyebrow">Serviço complementar</span><ArrowUpRight size={18} aria-hidden="true" /></div><h3>{related.name}</h3><p>{related.description}</p></Link>; })}</div></div></section>
      <PageCTA title="Vamos encontrar o próximo passo?" description="Conte-nos onde está e o que pretende melhorar. Definimos consigo uma primeira prioridade." href={contact} />
    </main>
  );
}
