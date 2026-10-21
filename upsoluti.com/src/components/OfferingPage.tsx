import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check, ChevronRight, Layers, Target, Workflow } from 'lucide-react';
import type { OfferingCopy } from '@/lib/offering-pages';
import { PageCTA } from './InnerUI';
import './offering-page.css';

const icons = [Target, Workflow, Layers];
export default function OfferingPage({ slug, name, title, highlight, copy, contact, ctaLabel, related = [], solution = false }: {
  slug: string; name: string; title: string; highlight: string; copy: OfferingCopy; contact: string; ctaLabel: string;
  related?: { name: string; href: string }[]; solution?: boolean;
}) {
  return <main className="inner-page offering-page">
    <section className="offering-hero" aria-labelledby="offering-title">
      <div className="offering-art"><Image src={'/illustrations/offerings/' + slug + '.webp'} alt={copy.alt} width={960} height={720} sizes="(min-width: 1600px) 1000px, (min-width: 900px) 64vw, 100vw" loading="eager" fetchPriority="high" /></div>
      <div className="container-main">
        <nav className="inner-breadcrumb" aria-label="Percurso"><Link href="/">Início</Link><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{name}</span></nav>
        <div className="offering-hero-grid">
          <div className="offering-intro"><p className="inner-eyebrow">{solution ? 'Solução' : 'Serviço'} · {name}</p><h1 id="offering-title">{title}<span>{highlight}</span></h1><p className="offering-description">{copy.summary}</p><ul className="offering-tags" aria-label="Áreas principais">{copy.tags.map(tag => <li key={tag}><Check size={14} aria-hidden="true" />{tag}</li>)}</ul><Link className="inner-button" href={contact}>{ctaLabel}<ArrowUpRight size={18} aria-hidden="true" /></Link></div>

        </div>
      </div>
    </section>
    <section className="offering-section" aria-labelledby="offering-benefits"><div className="container-main"><div className="offering-section-heading"><p className="inner-eyebrow">O que muda</p><h2 id="offering-benefits">Mais valor no dia a dia.</h2></div><div className="offering-benefits">{copy.benefits.map((item, index) => { const Icon = icons[index]; return <article key={item.title}><Icon size={23} aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div></div></section>
    <section className="offering-section offering-delivery" aria-labelledby="offering-deliveries"><div className="container-main"><div className="offering-section-heading"><p className="inner-eyebrow">O que entregamos</p><h2 id="offering-deliveries">As peças certas.</h2></div><div className="offering-capabilities">{copy.deliveries.map((item, index) => { const content = <><span className="offering-index">{String(index + 1).padStart(2, '0')}{item.href && <ArrowUpRight size={17} aria-hidden="true" />}</span><h3>{item.title}</h3><p>{item.text}</p></>; return item.href ? <Link key={item.title} className="offering-capability" href={item.href}>{content}</Link> : <article key={item.title} className="offering-capability">{content}</article>; })}</div><p className="offering-note">{copy.note}</p>{related.length > 0 && <nav className="offering-related" aria-label="Serviços complementares">{related.map(item => <Link key={item.href} href={item.href}>{item.name}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}</nav>}</div></section>
    <PageCTA title={solution ? 'O que gostaria de melhorar primeiro?' : slug === 'software' ? 'Qual é o processo que precisa de simplificar?' : 'Vamos encontrar o próximo passo?'} description={solution ? 'Conte-nos o contexto. Definimos consigo a prioridade, o âmbito e o investimento.' : 'Conte-nos o desafio. Definimos consigo o que construir primeiro.'} href={contact} label={solution ? 'Pedir um diagnóstico' : 'Conversar sobre o projeto'} />
  </main>;
}
