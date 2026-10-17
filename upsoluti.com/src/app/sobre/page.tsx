import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { SectionHeading, InfoCard, ProcessSteps, PageCTA } from '@/components/InnerUI';
import { Target, Layers, Users, Compass } from 'lucide-react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Sobre a UPsoluti', 'Marketing, software, automação e IA com uma visão integrada do seu negócio.', '/sobre');
const values = [
  { icon: Target, title: 'Utilidade primeiro', description: 'A tecnologia começa numa necessidade real, não numa lista de ferramentas.' },
  { icon: Layers, title: 'Tudo com contexto', description: 'Pensamos na ligação entre a experiência do cliente e o trabalho da equipa.' },
  { icon: Users, title: 'Proximidade no processo', description: 'Decisões claras, validação por etapas e responsabilidades alinhadas.' },
  { icon: Compass, title: 'Espaço para evoluir', description: 'Começamos pelo essencial e planeamos as próximas melhorias com base na utilização.' },
];
export default function AboutPage() {
  return <main className="inner-page">
    <PageHeader breadcrumb="Sobre a UPsoluti" title="Tecnologia próxima." highlight="Visão integrada." subtitle="Juntamos marketing, software, automação e inteligência artificial para ajudar empresas a trabalhar melhor e criar novas oportunidades." />
    <section className="inner-section"><div className="container-main inner-split"><div className="inner-copy"><p className="inner-eyebrow">O nosso papel</p><h2>Entre o seu desafio e a solução certa.</h2><p>Os problemas de uma empresa raramente vivem numa só ferramenta. Uma campanha depende da página que recebe o visitante. Um bom atendimento depende da informação disponível. Uma automação depende do processo que a sustenta.</p><p>A UPsoluti olha para essas ligações. O objetivo é escolher o que faz sentido para a sua operação e construir um percurso que a equipa consegue utilizar e acompanhar.</p></div><div className="inner-panel"><p className="inner-eyebrow">Como pensamos</p><h2>Começar pequeno.<br />Construir com direção.</h2><p>Uma prioridade bem definida permite validar a utilidade antes de aumentar a complexidade. O âmbito, as entregas e o acompanhamento são alinhados consigo desde o início.</p><div className="inner-tags"><span>Marketing</span><span>Software</span><span>Automação</span><span>IA aplicada</span></div></div></div></section>

    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="O que orienta o trabalho" title="Quatro princípios. A mesma direção." /><div className="inner-grid">{values.map(value => <InfoCard key={value.title} {...value} />)}</div></div></section>
    <section className="inner-section"><div className="container-main"><SectionHeading eyebrow="Da conversa à utilização" title="Um processo que se percebe." /><ProcessSteps steps={[{ title: 'Entender', desc: 'Ouvir a equipa e identificar o ponto de maior fricção.' }, { title: 'Definir', desc: 'Escolher prioridades, entregas e critérios de validação.' }, { title: 'Construir', desc: 'Implementar e validar em etapas acordadas.' }, { title: 'Acompanhar', desc: 'Rever a utilização e planear a evolução necessária.' }]} /></div></section>
    <PageCTA title="Vamos olhar para o seu negócio?" description="Não precisa de chegar com uma solução escolhida. Começamos pela necessidade." />
    <section className="inner-section"><div className="container-main about-profile"><div className="about-portrait"><Image src="/images/lucilius-meneses.png" alt="Lucilius Meneses" width={640} height={640} sizes="(max-width: 700px) 170px, 210px" /></div><div className="inner-copy"><p className="inner-eyebrow">Pessoas por trás da tecnologia</p><h2>Lucilius Meneses</h2><p className="about-qualification">Formado em Sistemas de Informação desde 2018.</p><p>Uma base em sistemas de informação e conhecimentos em inteligência artificial para olhar para os desafios das empresas com uma perspetiva integrada: pessoas, processos e tecnologia.</p><p>Na UPsoluti, essa visão orienta a procura de soluções úteis — ligar ferramentas, simplificar rotinas e explorar aplicações de IA que façam sentido para cada negócio.</p><div className="inner-tags"><span>Sistemas de Informação</span><span>Inteligência artificial</span><span>Tecnologia aplicada ao negócio</span></div></div></div></section>
  </main>;
}
