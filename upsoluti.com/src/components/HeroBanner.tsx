'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const banners = [
  { name: 'banner1', image: 'desenvolvimento-web' },
  { name: 'banner2', image: 'automacao' },
];

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const respectMotion = () => { if (motion.matches) setPlaying(false); };
    respectMotion();
    motion.addEventListener('change', respectMotion);
    return () => motion.removeEventListener('change', respectMotion);
  }, []);

  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [playing, hovered]);

  return (
    <div className="hero-banner" role="region" aria-roledescription="carrossel" aria-label="Banners em destaque" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setPlaying(false)}>
      {banners.map((banner, index) => (
        <div key={banner.name} id={banner.name} role="group" aria-roledescription="slide" aria-label={`${banner.name}, ${index + 1} de 2`} aria-hidden={active !== index} inert={active !== index} className={`hero-banner-slide hero-banner-commercial${active === index ? ' is-active' : ''}`} style={{ backgroundImage: `linear-gradient(90deg, #171020 0%, #171020f5 30%, #171020b3 55%, #17102020 100%), url('/illustrations/offerings/${banner.image}.webp')` }}>
          {index === 0 && <div className="container-main hero-banner-content">
            <p className="hero-banner-kicker">SITE + CRM · UPSOLUTI</p>
            <h2>O seu site atrai.<br /><span>O CRM dá continuidade.</span></h2>
            <p className="hero-banner-description">Ligue a presença online à gestão comercial. Receba pedidos pelo site e acompanhe cada oportunidade num só lugar.</p>
            <Link className="hero-banner-cta" href="/contacto?origem=home-banner1-site-crm&objetivo=software">Quero conhecer <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>}
          {index === 1 && <div className="container-main hero-banner-content">
            <p className="hero-banner-kicker">LANDING PAGE · UPSOLUTI</p>
            <h2>Uma página.<br /><span>O próximo passo do seu negócio.</span></h2>
            <p className="hero-banner-description">Apresente a sua oferta e facilite o contacto.</p>
            <Link className="hero-banner-cta" href="/contacto?origem=home-banner2-landing-page&objetivo=website">Quero a minha landing page <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>}
        </div>
      ))}
      <button type="button" className="hero-banner-arrow hero-banner-prev" aria-label="Banner anterior" onClick={() => setActive((active + 1) % banners.length)}><ChevronLeft aria-hidden="true" /></button>
      <button type="button" className="hero-banner-arrow hero-banner-next" aria-label="Próximo banner" onClick={() => setActive((active + 1) % banners.length)}><ChevronRight aria-hidden="true" /></button>
      <button type="button" className="hero-banner-playback" aria-label={playing ? 'Pausar slides' : 'Reproduzir slides'} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}</button>
    </div>
  );
}
