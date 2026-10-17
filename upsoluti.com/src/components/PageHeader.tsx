import Link from 'next/link';
import HeroBackground from './HeroBackground';
import { ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  highlight?: string;
  subtitle?: string;
  breadcrumb?: string;
  cta?: { label: string; href: string };
}

export default function PageHeader({ title, highlight, subtitle, breadcrumb, cta }: PageHeaderProps) {
  return (
    <section className="inner-hero">
      <div className="inner-hero-grid" aria-hidden="true" />
      <HeroBackground key={breadcrumb || title} />
      <div className="container-main">
        <nav className="inner-breadcrumb" aria-label="Percurso"><Link href="/">Início</Link><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{breadcrumb || title}</span></nav>
        <p className="inner-eyebrow"><Sparkles size={14} aria-hidden="true" />{breadcrumb || 'UPsoluti'}</p>
        <h1>{title}{highlight && <> <span>{highlight}</span></>}</h1>
        {subtitle && <p className="inner-hero-description">{subtitle}</p>}
        {cta && <Link className="inner-button" href={cta.href}>{cta.label}<ArrowUpRight size={18} aria-hidden="true" /></Link>}
      </div>
    </section>
  );
}
