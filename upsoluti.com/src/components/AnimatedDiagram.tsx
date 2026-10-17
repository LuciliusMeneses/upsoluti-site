"use client";

import { useId } from 'react';
import { useMotionState } from './useMotionState';
import { diagramCopy, type DiagramVariant } from '@/lib/diagrams';

export default function AnimatedDiagram({ variant }: { variant: DiagramVariant }) {
  const id = useId().replace(/:/g, '');
  const { ref, reduced, running } = useMotionState<HTMLElement>();
  const copy = diagramCopy[variant];
  return (
    <figure ref={ref} className="animated-diagram" data-variant={variant} data-motion={running ? 'running' : reduced ? 'reduced' : 'paused'}>
      <div className="diagram-toolbar"><figcaption><span>{copy.title}</span><small>{copy.subtitle}</small></figcaption></div>
      <svg viewBox="0 0 600 300" role="img" aria-labelledby={id + '-title ' + id + '-description'} className="diagram-svg">
        <title id={id + '-title'}>{copy.title}</title><desc id={id + '-description'}>{copy.description}</desc>
        <defs><linearGradient id={id + '-gradient'} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#8554b8" /><stop offset="1" stopColor="#deb5ff" /></linearGradient><radialGradient id={id + '-glow'}><stop stopColor="#a326d7" stopOpacity=".18" /><stop offset="1" stopColor="#a326d7" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="300" cy="145" rx="240" ry="140" fill={'url(#' + id + '-glow)'} />
        {variant === 'growth' && <>
          <g className="diagram-grid"><path d="M48 65H552 M48 115H552 M48 165H552 M48 215H552 M48 55V225 M174 55V225 M300 55V225 M426 55V225 M552 55V225" /></g>
          <path d="M50 215 C140 215 155 175 224 172 S330 158 366 118 S465 105 548 58 L548 230H50Z" fill={'url(#' + id + '-gradient)'} opacity=".07" />
          <path className="diagram-curve" d="M50 215 C140 215 155 175 224 172 S330 158 366 118 S465 105 548 58" stroke={'url(#' + id + '-gradient)'} />
          <path className="diagram-trace" d="M50 215 C140 215 155 175 224 172 S330 158 366 118 S465 105 548 58" pathLength="100" />
          {[{ x: 50, y: 215 }, { x: 224, y: 172 }, { x: 366, y: 118 }, { x: 548, y: 58 }].map((point, index) => <g key={point.x}><circle className={'diagram-halo halo-' + index} cx={point.x} cy={point.y} r="12" /><circle cx={point.x} cy={point.y} r="4" className="diagram-point" /></g>)}
          <text x="50" y="267" className="diagram-label" textAnchor="start">Descoberta</text><text x="300" y="267" className="diagram-label" textAnchor="middle">Interesse</text><text x="550" y="267" className="diagram-label" textAnchor="end">Conversa</text>
        </>}
        {variant === 'automation' && <>
          <path className="diagram-connector" d="M176 150H236 M364 150H424" />
          <path className="diagram-signal" d="M176 150H236 M364 150H424" />
          {[{ x: 48, label: 'Entrada' }, { x: 236, label: 'Regras' }, { x: 424, label: 'Ação' }].map((node, index) => <g key={node.label} className={'diagram-workflow-node workflow-node-' + index}><rect x={node.x} y="95" width="128" height="110" rx="20" className="diagram-box" /><rect x={node.x + 43} y="117" width="42" height="34" rx="10" className="diagram-node-icon" /><path d={index === 0 ? 'M' + (node.x + 54) + ' 130h20m-20 7h14' : index === 1 ? 'M' + (node.x + 55) + ' 134l6 6 13-13' : 'M' + (node.x + 55) + ' 134h19m-6-6 6 6-6 6'} className="diagram-glyph" /><text x={node.x + 64} y="179" textAnchor="middle" className="diagram-label">{node.label}</text></g>)}
          <text x="300" y="260" textAnchor="middle" className="diagram-muted-label">Informação ligada entre cada etapa</text>
        </>}
        {variant === 'intelligence' && <>
          <circle cx="300" cy="150" r="99" className="diagram-orbit" /><ellipse cx="300" cy="150" rx="140" ry="65" className="diagram-orbit diagram-orbit-tilted" />
          <path className="diagram-connector" d="M130 72L300 150 470 72 M130 228L300 150 470 228" />
          <path className="diagram-signal" d="M130 72L300 150 470 72 M130 228L300 150 470 228" />
          <circle cx="300" cy="150" r="60" className="diagram-core-halo" /><rect x="255" y="105" width="90" height="90" rx="26" className="diagram-core-box" /><path d="m300 127 7 16 16 7-16 7-7 16-7-16-16-7 16-7Z" className="diagram-glyph" />
          {[{ x: 130, y: 72, label: 'Fontes' }, { x: 470, y: 72, label: 'Perguntas' }, { x: 130, y: 228, label: 'Contexto' }, { x: 470, y: 228, label: 'Equipa' }].map(node => <g key={node.label}><rect x={node.x - 54} y={node.y - 19} width="108" height="38" rx="12" className="diagram-box" /><text x={node.x} y={node.y + 5} textAnchor="middle" className="diagram-label">{node.label}</text></g>)}
        </>}
      </svg>
      <p className="diagram-description">{copy.caption}</p>
    </figure>
  );
}
