import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight, Bot, Code2, Workflow, TrendingUp, ChevronDown, Sparkles, ShieldCheck, Blocks, ScanLine} from 'lucide-react';
import HeroSection from './HeroSection';
import ContactForm from './ContactForm';
import QuickDiagnostic from './QuickDiagnostic';
import ChatWidget from './ChatWidget';
import StructuredData from './StructuredData';
import {siteUrl} from '@/lib/site';

const challenges=[
 ['Os pedidos ficam espalhados.','Formulários, e-mails e conversas sem um ponto de acompanhamento. Quando chega a hora de responder, falta o contexto.'],
 ['A rotina depende de copiar e colar.','Os mesmos dados passam de uma ferramenta para outra. A equipa repete tarefas que poderiam ser simplificadas.'],
 ['O marketing não chega às vendas.','Há visitas e contactos, mas é difícil perceber o que acontece depois. Falta ligar a presença digital ao seguimento comercial.'],
];
const solutions=[
 {href:'/solucoes/escalar-ia',icon:Bot,category:'Inteligência artificial',title:'Respostas com mais contexto.',text:'Explore assistentes que ajudam a consultar informação e a orientar o atendimento, com limites definidos e supervisão humana.',cta:'Explorar inteligência artificial'},
 {href:'/solucoes/automatizar',icon:Workflow,category:'Automação e CRM',title:'Menos repetição na rotina.',text:'Ligue etapas e organize o seguimento comercial, conforme as ferramentas e os processos da sua empresa.',cta:'Conhecer as possibilidades'},
 {href:'/solucoes/vender-mais',icon:TrendingUp,category:'Marketing e vendas',title:'Do contacto à oportunidade.',text:'Planeie a presença digital e o acompanhamento dos contactos com uma visão comercial.',cta:'Explorar marketing e vendas'},
 {href:'/servicos/desenvolvimento-web',icon:Code2,category:'Websites e aplicações',title:'Um site com um próximo passo.',text:'Apresente a oferta, receba pedidos e desenhe um percurso claro até ao contacto.',cta:'Conhecer websites e aplicações'},
];
const steps=[
 ['Perceber antes de propor','Conversamos sobre a sua rotina, as ferramentas que utiliza e o problema prioritário. Definimos o âmbito e as condições em proposta.'],
 ['Construir e validar por etapas','Desenvolvemos a solução acordada e verificamos os percursos com a sua equipa. As integrações dependem das ferramentas e acessos disponíveis.'],
 ['Preparar a utilização','Explicamos o funcionamento, alinhamos a passagem para a operação e definimos o acompanhamento previsto para o projeto.'],
];
const questions=[
 ['A minha empresa precisa de todas estas soluções?','Não. O diagnóstico serve para identificar a prioridade. O projeto pode começar por um website, uma automação, o acompanhamento comercial ou outra necessidade concreta. O âmbito é definido antes da implementação.'],
 ['Podem trabalhar com as ferramentas que já utilizo?','Avaliamos as possibilidades de integração e as limitações das suas ferramentas. Nem todos os sistemas disponibilizam os acessos necessários; confirmamos a viabilidade antes de incluir uma ligação na proposta.'],
 ['Quanto custa e quanto tempo demora?','O investimento e o prazo dependem do âmbito, dos conteúdos, das integrações e dos acessos necessários. A proposta define entregas, condições e responsabilidades. Não existe um preço ou prazo único para todos os projetos.'],
 ['A inteligência artificial substitui a minha equipa?','A proposta é apoiar o trabalho e simplificar tarefas adequadas à automação. Definimos os limites e os pontos de revisão humana. Decisões comerciais e compromissos com clientes continuam a exigir validação.'],
 ['A demonstração é um projeto de um cliente?','Não. O exemplo de site e CRM desta página utiliza dados fictícios para mostrar o percurso. Não representa um caso de sucesso nem garante resultados para outra empresa.'],
 ['O que devo enviar para começar?','Conte-nos o que pretende melhorar, como funciona hoje e que ferramentas utiliza. Não precisa de chegar com uma solução técnica escolhida. Nunca envie palavras-passe ou dados sensíveis no formulário.'],
];

export default function BusinessHome(){
 return <main className="ai-home business-home">
  <StructuredData data={{'@context':'https://schema.org','@graph':[
   {'@type':'Organization','@id':siteUrl+'/#organization',name:'UPsoluti',url:siteUrl+'/',logo:siteUrl+'/brand/upsoluti-symbol.png',email:'contacto@upsoluti.com'},
   {'@type':'WebSite','@id':siteUrl+'/#website',url:siteUrl+'/',name:'UPsoluti',inLanguage:'pt-PT',publisher:{'@id':siteUrl+'/#organization'}},
  ]}}/>
  <HeroSection/>
  <section className="business-challenges" aria-labelledby="challenges-title"><div className="container-main">
   <div className="business-section-heading"><p className="ai-eyebrow">Reconhece alguma destas situações?</p><h2 id="challenges-title">O trabalho avança.<br/><span>O acompanhamento fica para depois.</span></h2><p>Começamos pelo que acontece no seu dia a dia, para escolher a tecnologia que faz sentido.</p></div>
   <div className="business-challenge-grid">{challenges.map(([title,text],index)=><article key={title}><span className="business-index">0{index+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
  </div></section>
  <section className="business-solutions" id="solucoes" aria-labelledby="solutions-title"><div className="container-main">
   <div className="ai-section-heading"><div><p className="ai-eyebrow"><Sparkles size={14} aria-hidden="true"/>Uma solução para cada prioridade</p><h2 id="solutions-title">Da necessidade<br/><span>ao próximo passo.</span></h2></div><p className="business-heading-note">Escolha o desafio que mais se aproxima do seu. Cada solução tem possibilidades e limites próprios.</p></div>
   <div className="business-solutions-grid">{solutions.map(({href,icon:Icon,category,title,text,cta})=><Link key={href} href={href} className="business-solution"><div className="business-solution-top"><Icon size={24} aria-hidden="true"/><span>{category}</span></div><h3>{title}</h3><p>{text}</p><span className="business-tile-cta">{cta}<ArrowUpRight size={17} aria-hidden="true"/></span></Link>)}</div>
  </div></section>
  <section id="demonstracao" className="business-demo" aria-labelledby="demo-title"><div className="container-main business-demo-grid">
   <div className="business-demo-copy"><p className="ai-eyebrow">Veja um exemplo funcional</p><h2 id="demo-title">O site recebe.<br/><span>O CRM acompanha.</span></h2><p>Explore uma demonstração de website com gestão comercial. Veja a experiência de quem visita o site e o ambiente de acompanhamento dos pedidos.</p><ol className="business-demo-steps"><li>Conheça a oferta e o formulário do site.</li><li>Abra a demonstração do CRM.</li><li>Observe como os pedidos podem ser acompanhados.</li></ol><div className="business-actions"><a className="business-primary" href="https://landingpage-crm-gamma.vercel.app" target="_blank" rel="noopener noreferrer">Abrir site de demonstração<ArrowUpRight size={17} aria-hidden="true"/></a><a className="business-secondary" href="https://landingpage-crm-gamma.vercel.app/crm" target="_blank" rel="noopener noreferrer">Explorar CRM<ArrowUpRight size={17} aria-hidden="true"/></a></div><p className="business-demo-note">Demonstração com dados fictícios. Não é um caso de cliente nem uma promessa de resultados. Acesso e funções dependem das permissões do ambiente.</p></div>
   <figure className="business-demo-frame"><div className="business-browser-bar"><span/><span/><span/><p>UPsoluti · demonstração</p></div><div className="business-demo-image"><Image src="/demos/landingpage-estetica-current.webp" width={1200} height={2704} sizes="(max-width: 767px) 90vw, 45vw" alt="Prévia do site de demonstração de estética, com apresentação dos serviços e chamada para contacto"/></div><figcaption>Exemplo de apresentação comercial · prévia do site</figcaption></figure>
  </div></section>
  <section className="ai-process" aria-labelledby="process-title"><div className="container-main"><div className="ai-process-heading"><p className="ai-eyebrow">Como trabalhamos</p><h2 id="process-title">Um projeto claro.<br/>Uma etapa de cada vez.</h2></div><ol className="ai-process-steps">{steps.map(([title,text],index)=><li key={title}><span className="ai-step-number">0{index+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol><details className="ai-diagnostic-disclosure"><summary><span><Sparkles size={17} aria-hidden="true"/>Ainda não sabe por onde começar?</span><span className="ai-disclosure-action">Identificar a prioridade<ChevronDown size={17} aria-hidden="true"/></span></summary><div className="ai-diagnostic-content"><QuickDiagnostic/></div></details></div></section>
  <section className="ai-principles" aria-labelledby="principles-title"><div className="container-main"><p className="ai-eyebrow">O que deve esperar do projeto</p><h2 id="principles-title">Clareza também faz parte da solução.</h2><div className="ai-principles-grid"><article><ScanLine size={22} aria-hidden="true"/><h3>Âmbito definido</h3><p>Entregas, dependências e condições são alinhadas na proposta. Uma funcionalidade em avaliação não é apresentada como pronta.</p></article><article><Blocks size={22} aria-hidden="true"/><h3>Validação por etapas</h3><p>Os percursos são verificados antes da entrega. A demonstração ajuda a discutir o funcionamento, sem substituir os testes do seu projeto.</p></article><article><ShieldCheck size={22} aria-hidden="true"/><h3>Atenção aos dados</h3><p>Permissões, privacidade e tratamento da informação fazem parte das decisões de implementação.</p></article></div></div></section>
  <section className="business-assistant" id="consultor" aria-labelledby="assistant-title"><div className="container-main"><div className="business-section-heading"><p className="ai-eyebrow">Uma primeira orientação</p><h2 id="assistant-title">Conte o desafio à Ana.</h2><p>A nossa assistente virtual pode explicar as soluções e ajudar a preparar o contexto. A proposta e as decisões do projeto são tratadas com a equipa.</p></div><ChatWidget embedded/></div></section>
  <section className="business-faq" aria-labelledby="faq-title"><div className="container-main business-faq-grid"><div><p className="ai-eyebrow">Antes de avançar</p><h2 id="faq-title">Perguntas que<br/><span>merecem uma resposta.</span></h2><Link href="#proposta" className="business-text-link">Falar sobre o meu projeto<ArrowUpRight size={16} aria-hidden="true"/></Link></div><div className="business-faq-list">{questions.map(([title,answer])=><details key={title}><summary>{title}<ChevronDown size={17} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></div></section>
  <ContactForm/>
 </main>;
}
