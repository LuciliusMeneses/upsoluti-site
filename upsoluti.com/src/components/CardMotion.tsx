"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CardMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let cards: HTMLElement[] = [];
    const reset = () => { observer?.disconnect(); cards.forEach(card => card.classList.remove('motion-ready', 'motion-visible')); };
    const start = () => {
      reset();
      cards = Array.from(document.querySelectorAll<HTMLElement>('.ai-tile, .inner-card, .inner-cta'));
      if (media.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('motion-visible');
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px 12px 0px' });
      cards.forEach((card, index) => {
        card.style.setProperty('--card-delay', (index % 3) * 70 + 'ms');
        card.classList.add('motion-ready');
        observer?.observe(card);
      });
    };
    frame = requestAnimationFrame(start);
    media.addEventListener('change', start);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', start); reset(); };
  }, [pathname]);
  return null;
}
