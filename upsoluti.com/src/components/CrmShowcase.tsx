'use client';
import { useEffect, useRef } from 'react';
import { LayoutDashboard, Users, ChartNoAxesCombined, Search, ArrowUpRight, Check, Layers } from 'lucide-react';

const columns = [{ title: 'Novos contactos', cards: ['Pedido pelo website', 'Contacto por indicação'] }, { title: 'Em conversa', cards: ['Diagnóstico inicial', 'Reunião de descoberta'] }, { title: 'Proposta', cards: ['Solução à medida', 'Integração de sistemas'] }];
export default function CrmShowcase() {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) { el.style.setProperty('--crm-tilt', '0deg'); el.style.setProperty('--crm-turn', '0deg'); el.style.setProperty('--crm-lift', '0px'); return; }
      const rect = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      el.style.setProperty('--crm-tilt', (12 - progress * 19) + 'deg');
      el.style.setProperty('--crm-turn', (-9 + progress * 15) + 'deg');
      el.style.setProperty('--crm-lift', (22 - progress * 44) + 'px');
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule); reduced.addEventListener('change', schedule); update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); reduced.removeEventListener('change', schedule); };
  }, []);
  return <section className="inner-section crm-section"><div className="container-main"><div className="crm-intro"><div><p className="inner-eyebrow">Do processo à interface</p><h2>Uma visão clara.<br />Do primeiro contacto ao próximo passo.</h2></div><p>Um CRM é um dos sistemas que podemos construir: contactos, oportunidades e tarefas ligados ao seu processo comercial.</p></div><div className="crm-scene" ref={scene}><div className="crm-orbit" aria-hidden="true" /><div className="crm-screen" role="img" aria-label="Exemplo de interface CRM com contactos, tarefas e oportunidades organizadas por etapa comercial."><div className="crm-window"><span /><span /><span /><span className="crm-window-label">UPsoluti · CRM à medida</span></div><div className="crm-app"><aside className="crm-sidebar"><div className="crm-logo"><Layers size={19} /> UP<span>CRM</span></div><div className="crm-nav-item"><LayoutDashboard size={16} /> Visão geral</div><div className="crm-nav-item active"><ChartNoAxesCombined size={16} /> Oportunidades</div><div className="crm-nav-item"><Users size={16} /> Contactos</div><div className="crm-sidebar-bottom">O seu processo.<br />Num só lugar.</div></aside><div className="crm-workspace"><div className="crm-toolbar"><div><span className="crm-overline">ESPAÇO COMERCIAL</span><h3>Oportunidades</h3></div><Search size={18} /></div><div className="crm-summary"><div><span>Contactos</span><strong>Contexto completo</strong></div><div><span>Seguimento</span><strong>Próxima ação definida</strong></div><div><span>Equipa</span><strong>Responsáveis claros</strong></div></div><div className="crm-board">{columns.map((column, i) => <div className="crm-column" key={column.title}><div className="crm-column-title"><i />{column.title}<span>02</span></div>{column.cards.map((card, j) => <div className="crm-opportunity" key={card}><span className="crm-card-label">{j ? 'Acompanhamento' : 'Novo projeto'}</span><h4>{card}</h4><div className="crm-card-lines"><span /><span /></div><div className="crm-card-bottom"><span className="crm-avatar">{['LM', 'EQ', 'UP'][i]}</span><span>{j ? 'Próxima ação' : 'Ver contexto'}</span><ArrowUpRight size={13} /></div></div>)}</div>)}</div></div></div><div className="crm-floating"><span><Check size={15} /></span><div><strong>Cada oportunidade, um próximo passo.</strong><small>Histórico · responsável · acompanhamento</small></div></div></div></div><p className="crm-caption">CRM, portais e ferramentas internas — funcionalidades definidas para a sua operação.</p></div></section>;
}
