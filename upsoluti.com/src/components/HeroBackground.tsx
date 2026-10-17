"use client";

import { useId } from 'react';
import { usePathname } from 'next/navigation';
import { useMotionState } from './useMotionState';

export default function HeroBackground() {
  const id = useId().replace(/:/g, '');
  const pathname = usePathname();
  const { ref, reduced, running } = useMotionState<HTMLDivElement>();
  const variant = /escalar-ia|inteligencia|qualificacao/.test(pathname) ? 'intelligence' : /vender-mais|marketing|seo|growth/.test(pathname) ? 'growth' : 'automation';

  return <>
    <div ref={ref} className="inner-hero-background" data-motion={running ? 'running' : reduced ? 'reduced' : 'paused'} data-variant={variant} aria-hidden="true">
      <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs><linearGradient id={id + '-line'}><stop stopColor="#8652aa" stopOpacity=".1" /><stop offset=".65" stopColor="#bf84e8" stopOpacity=".8" /><stop offset="1" stopColor="#e4b6ff" /></linearGradient><radialGradient id={id + '-halo'}><stop stopColor="#ab56d7" stopOpacity=".24" /><stop offset="1" stopColor="#ab56d7" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="700" cy="230" rx="330" ry="240" fill={'url(#' + id + '-halo)'} />
        <g className="hero-background-grid"><path d="M0 100H1000 M0 200H1000 M0 300H1000 M0 400H1000 M100 0V500 M200 0V500 M300 0V500 M400 0V500 M500 0V500 M600 0V500 M700 0V500 M800 0V500 M900 0V500" /></g>
        {variant === 'growth' ? <>
          <path className="hero-background-area" d="M100 410 C240 410 270 345 370 345 S480 255 570 255 S700 170 780 170 S910 85 1000 65V500H100Z" fill={'url(#' + id + '-line)'} />
          <path className="hero-background-line" d="M100 410 C240 410 270 345 370 345 S480 255 570 255 S700 170 780 170 S910 85 1000 65" stroke={'url(#' + id + '-line)'} />
          <path className="hero-background-trace" pathLength="100" d="M100 410 C240 410 270 345 370 345 S480 255 570 255 S700 170 780 170 S910 85 1000 65" />
          {[{x:370,y:345},{x:570,y:255},{x:780,y:170},{x:960,y:80}].map((node,index)=><g key={node.x}><circle className={'hero-background-node node-delay-'+index} cx={node.x} cy={node.y} r="15" /><circle className="hero-background-dot" cx={node.x} cy={node.y} r="4" /></g>)}
        </> : variant === 'intelligence' ? <>
          <circle cx="730" cy="250" r="170" className="hero-background-orbit" /><ellipse cx="730" cy="250" rx="240" ry="95" className="hero-background-orbit orbit-reverse" />
          <path className="hero-background-connection" d="M470 95L730 250 950 70 M450 410L730 250 980 420 M730 250H1000" />
          <path className="hero-background-transfer" d="M470 95L730 250 950 70 M450 410L730 250 980 420 M730 250H1000" />
          <rect x="687" y="207" width="86" height="86" rx="24" className="hero-background-core" /><path d="m730 225 8 17 17 8-17 8-8 17-8-17-17-8 17-8Z" className="hero-background-star" />
          {[{x:470,y:95},{x:950,y:70},{x:450,y:410},{x:980,y:420}].map((node,index)=><g key={node.x}><circle className={'hero-background-node node-delay-'+index} cx={node.x} cy={node.y} r="20" /><circle className="hero-background-dot" cx={node.x} cy={node.y} r="5" /></g>)}
        </> : <>
          <path className="hero-background-connection" d="M250 340H430Q455 340 455 315V220Q455 195 480 195H690Q715 195 715 170V110Q715 85 740 85H1000 M455 220V400Q455 425 480 425H1000 M715 110V300Q715 325 740 325H1000" />
          <path className="hero-background-transfer" d="M250 340H430Q455 340 455 315V220Q455 195 480 195H690Q715 195 715 170V110Q715 85 740 85H1000 M455 220V400Q455 425 480 425H1000 M715 110V300Q715 325 740 325H1000" />
          {[{x:250,y:340},{x:455,y:195},{x:715,y:85},{x:900,y:325},{x:620,y:425}].map((node,index)=><g key={node.x}><rect x={node.x-25} y={node.y-25} width="50" height="50" rx="14" className={'hero-background-box node-delay-'+index} /><circle className="hero-background-dot" cx={node.x} cy={node.y} r="4" /></g>)}
        </>}
      </svg>
    </div>
  </>;
}
