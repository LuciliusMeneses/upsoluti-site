import DemoMonitor from '@/components/DemoMonitor';
import { ArrowUpRight } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="hero-banner" role="region" aria-label="Site e CRM em destaque">
      <div id="banner1" className="hero-banner-slide hero-banner-commercial is-active" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 45%, #70369880, transparent 60%), linear-gradient(110deg, #171020, #24142f)' }}>
        <div className="container-main hero-banner-content hero-demo-layout">
          <p className="hero-banner-kicker">SITE + CRM · UPSOLUTI</p>
          <h2>O seu site atrai.<br /><span>O CRM dá continuidade.</span></h2>
          <p className="hero-banner-description">Ligue a presença online à gestão comercial. Receba pedidos pelo site e acompanhe cada oportunidade num só lugar.</p>
          <div className="hero-demo-actions">
            <a className="hero-banner-cta" href="https://landingpage-crm-gamma.vercel.app" target="_blank" rel="noopener noreferrer">Ver site DEMO <ArrowUpRight size={18} aria-hidden="true" /></a>
            <a className="hero-banner-cta hero-demo-secondary" href="https://landingpage-crm-gamma.vercel.app/crm" target="_blank" rel="noopener noreferrer">Ver CRM DEMO <ArrowUpRight size={18} aria-hidden="true" /></a>
          </div>
          <DemoMonitor active />
        </div>
      </div>
    </div>
  );
}
