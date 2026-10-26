'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export default function DemoMonitor({ active }: { active: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const [moving, setMoving] = useState(true);
  const [hovered, setHovered] = useState(false);
  const direction = useRef(1);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (preference.matches) setMoving(false); };
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = viewport.current;
    if (!element || !active || !moving || hovered) return;
    let frame = 0;
    let previous = 0;
    let position = element.scrollTop;
    let pauseUntil = 0;
    function tick(time: number) {
      const delta = previous ? Math.min(time - previous, 50) : 0;
      previous = time;
      if (element && !document.hidden && time >= pauseUntil) {
        const max = element.scrollHeight - element.clientHeight;
        if (max > 0) {
          position = Math.max(0, Math.min(max, position + direction.current * delta * .04));
          element.scrollTop = position;
          if (position >= max || position <= 0) { direction.current *= -1; pauseUntil = time + 1800; }
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, moving, hovered]);

  function updateScrollbar() {
    const element = viewport.current;
    if (element && thumb.current) {
      const max = element.scrollHeight - element.clientHeight;
      thumb.current.style.top = `${max > 0 ? element.scrollTop / max * 80 : 0}%`;
    }
  }

  return (
    <div className="hero-demo-glass hero-demo-monitor" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' }}>
      <div className="hero-demo-browser" aria-hidden="true"><span /><span /><span /><p>landingpage-crm · DEMO</p></div>
      <div className="hero-demo-display">
        <div ref={viewport} className="hero-demo-screen" tabIndex={0} role="region" aria-label="Prévia da landing page, com rolagem vertical" onScroll={updateScrollbar} onFocus={() => setMoving(false)} onWheel={() => setMoving(false)} onTouchStart={() => setMoving(false)}>
          <Image src="/demos/landingpage-estetica-current.webp" alt="Landing page de serviços de estética com a modelo recortada, tratamentos e formulário de agendamento" width={1200} height={2704} sizes="(max-width: 767px) 85vw, (max-width: 1280px) 45vw, 500px" className="hero-demo-long-screen" onLoad={updateScrollbar} />
        </div>
        <div className="hero-demo-scrollbar" aria-hidden="true"><span ref={thumb} /></div>
      </div>
      <div className="hero-demo-caption"><span>DEMONSTRAÇÃO ILUSTRATIVA</span><button type="button" className="hero-demo-motion" aria-label={moving ? 'Pausar rolagem da demonstração' : 'Reproduzir rolagem da demonstração'} onClick={() => setMoving(value => !value)}>{moving ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}</button></div>
    </div>
  );
}
