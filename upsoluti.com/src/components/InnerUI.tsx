import Link from 'next/link';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="inner-section-heading">{eyebrow && <p className="inner-eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div>;
}

export function InfoCard({ title, description, icon: Icon, href, label }: { title: string; description: string; icon: LucideIcon; href?: string; label?: string }) {
  const content = <><div className="inner-card-top"><span className="inner-icon"><Icon size={21} aria-hidden="true" /></span>{href && <ArrowUpRight size={19} aria-hidden="true" />}</div><h3>{title}</h3><p>{description}</p>{label && <span className="inner-card-label">{label}</span>}</>;
  return href ? <Link className="inner-card inner-card-link" href={href}>{content}</Link> : <article className="inner-card">{content}</article>;
}

export function ProcessSteps({ steps }: { steps: { title: string; desc: string }[] }) {
  return <ol className="inner-steps">{steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.desc}</p></li>)}</ol>;
}

export function FAQList({ items }: { items: { q: string; a: string }[] }) {
  return <div className="inner-faq">{items.map(item => <details key={item.q}><summary>{item.q}<Plus size={18} aria-hidden="true" /></summary><p>{item.a}</p></details>)}</div>;
}

export function CheckList({ items }: { items: string[] }) {
  return <ul className="inner-checklist">{items.map(item => <li key={item}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>;
}

export function PageCTA({ title, description, href = '/contacto', label = 'Conversar sobre o projeto' }: { title: string; description: string; href?: string; label?: string }) {
  return <section className="inner-section inner-section-cta"><div className="container-main"><div className="inner-cta"><div><p className="inner-eyebrow">Próximo passo</p><h2>{title}</h2><p>{description}</p></div><Link className="inner-button" href={href}>{label}<ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>;
}
