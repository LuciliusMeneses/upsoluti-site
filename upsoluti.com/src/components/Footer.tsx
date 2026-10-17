import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-main">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-mark">U</div>
              UPsoluti
            </div>
            <p className="footer-desc">
              Tecnologia, Marketing e Inteligência Artificial para impulsionar empresas para o próximo nível de eficiência e escala.
            </p>
          </div>

          <div>
            <h4 className="footer-column-title">Soluções</h4>
            <ul className="footer-links">
              <li><Link href="/solucoes/vender-mais" className="footer-link">Quero Vender Mais</Link></li>
              <li><Link href="/solucoes/automatizar" className="footer-link">Quero Automatizar</Link></li>
              <li><Link href="/solucoes/escalar-ia" className="footer-link">Quero Escalar com IA</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-column-title">Serviços</h4>
            <ul className="footer-links">
              <li><Link href="/servicos/marketing-digital" className="footer-link">Marketing Digital & Growth</Link></li>
              <li><Link href="/servicos/desenvolvimento-web" className="footer-link">Websites & Apps</Link></li>
              <li><Link href="/servicos/automacao" className="footer-link">Automação Empresarial</Link></li>
              <li><Link href="/servicos/inteligencia-artificial" className="footer-link">Inteligência Artificial</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4 className="footer-column-title">Contacto</h4>
            <p className="footer-contact-text">Pronto para transformar a sua operação com segurança e autonomia?</p>
            <Link href="/contacto" className="footer-cta">
              Falar com Consultor
            </Link>
          </div>
        </div>

        <div className="footer-bottom"><Link href="/politicas" className="footer-link">Políticas e privacidade</Link><span> · </span>
          © {new Date().getFullYear()} UPsoluti Sistemas Inteligentes. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
