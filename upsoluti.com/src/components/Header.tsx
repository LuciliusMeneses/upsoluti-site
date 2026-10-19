"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { services, solutions } from '@/lib/navigation';
export default function Header() {
 const [mobile, setMobile] = useState(false);
 const [dropdown, setDropdown] = useState<string | null>(null);
 const ref = useRef<HTMLElement>(null);
 const path = usePathname();
 function close() { setMobile(false); setDropdown(null); }
 useEffect(() => {
  function outside(e: PointerEvent) { if (!ref.current?.contains(e.target as Node)) close(); }
  document.addEventListener('pointerdown', outside);
  return () => document.removeEventListener('pointerdown', outside);
 }, []);
 return <header ref={ref} className="header" onKeyDown={e => { if(e.key === 'Escape') { const trigger = ref.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]'); close(); trigger?.focus(); } }}>
  <div className="container-main header-inner">
   <Link href="/" className="logo" onClick={close} aria-label="UPsoluti — início"><span role="img" aria-label="UPsoluti — Marketing Inteligente" className="header-brand-image"/></Link>
   <nav className="nav-desktop" aria-label="Navegação principal">
    {[{href:'/',label:'Início'},{href:'/sobre',label:'Sobre nós'}].map(item => <Link key={item.href} href={item.href} className="nav-link" aria-current={path === item.href ? 'page' : undefined} onClick={close}>{item.label}</Link>)}
    {[{id:'solutions',label:'Soluções',items:solutions},{id:'services',label:'Serviços',items:services}].map(group => <div key={group.id} className="nav-dropdown" onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setDropdown(null); }}>
     <button className="nav-dropdown-trigger" aria-expanded={dropdown === group.id} aria-controls={group.id} onClick={() => setDropdown(dropdown === group.id ? null : group.id)}>{group.label}<ChevronDown size={16} aria-hidden="true" /></button>
     <div id={group.id} className={'nav-dropdown-menu ' + (dropdown === group.id ? 'is-open' : '')} hidden={dropdown !== group.id}>{group.items.map(item => <Link key={item.href} href={item.href} className="nav-dropdown-item" onClick={close} aria-current={path === item.href ? 'page' : undefined}><span className="nav-dropdown-item-title">{item.label}</span></Link>)}</div>
    </div>)}
   </nav>
   <div className="header-cta"><Link href="/contacto" className="btn-primary">Agendar diagnóstico</Link></div>
   <button className="mobile-menu-btn" aria-label={mobile ? 'Fechar menu' : 'Abrir menu'} aria-controls="mobile-menu" aria-expanded={mobile} onClick={() => {setMobile(!mobile);setDropdown(null);}}>{mobile ? <X /> : <Menu />}</button>
  </div>
  <nav id="mobile-menu" aria-label="Navegação móvel" className={'mobile-menu '+(mobile?'open':'')} hidden={!mobile}>
   {[{href:'/',label:'Início'},{href:'/sobre',label:'Sobre nós'},...solutions,...services,{href:'/contacto',label:'Agendar diagnóstico'}].map(item => <Link key={item.href} href={item.href} className="mobile-nav-link" onClick={close} aria-current={path === item.href ? 'page' : undefined}>{item.label}</Link>)}
  </nav>
 </header>;
}
