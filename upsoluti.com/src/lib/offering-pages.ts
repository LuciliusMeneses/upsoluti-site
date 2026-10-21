export type OfferingCopy = {
  summary: string;
  tags: string[];
  benefits: { title: string; text: string }[];
  deliveries: { title: string; text: string; href?: string }[];
  note: string;
  alt: string;
};

export const offeringCopy: Record<string, OfferingCopy> = {
  'vender-mais': {
    summary: 'Ligue marketing, website e acompanhamento comercial para atrair as pessoas certas, transformar interesse em pedidos e dar à equipa o contexto necessário para avançar.',
    tags: ['Aquisição', 'Conversão', 'Crescimento'],
    benefits: [{title:'Contactos relevantes',text:'Canais e mensagens alinhados com a sua oferta.'},{title:'Menos oportunidades perdidas',text:'Um percurso claro entre a visita e o contacto.'},{title:'Seguimento com contexto',text:'Informação útil para a equipa comercial responder.'}],
    deliveries: [{title:'Marketing digital',text:'Campanhas e medição orientadas para oportunidades.',href:'/servicos/marketing-digital'},{title:'Websites e aplicações',text:'Páginas que facilitam o próximo passo.',href:'/servicos/desenvolvimento-web'},{title:'SEO e visibilidade',text:'Conteúdo e estrutura para pesquisas relevantes.',href:'/servicos/seo'}],
    note:'Podemos corrigir perdas no percurso atual antes de aumentar o investimento.',
    alt:'Funil de vendas 3D com contactos e oportunidades a convergir num gráfico de crescimento.',
  },
  'automatizar': {
    summary: 'Ligue aplicações e departamentos para reduzir tarefas repetitivas, fazer circular a informação e acompanhar cada pedido, com regras claras e espaço para intervenção humana.',
    tags:['Processos','Integrações','Controlo'],
    benefits:[{title:'Tempo para a equipa',text:'Menos cópias de dados e lembretes manuais.'},{title:'Informação consistente',text:'Dados validados entre ferramentas e responsáveis.'},{title:'Exceções previstas',text:'Visibilidade sobre falhas e intervenção humana.'}],
    deliveries:[{title:'Automação empresarial',text:'Mapeamento, regras e execução dos fluxos.',href:'/servicos/automacao'},{title:'Software à medida',text:'Funcionalidades para ligar a sua operação.',href:'/servicos/software'},{title:'Inteligência artificial',text:'Apoio à classificação e ao tratamento de informação.',href:'/servicos/inteligencia-artificial'}],
    note:'Começamos por uma rotina delimitada. As integrações dependem dos acessos disponíveis.',
    alt:'Aplicações e departamentos em plataformas 3D ligados por fluxos de informação.',
  },
  'escalar-ia': {
    summary:'Torne o conhecimento da empresa mais acessível com assistentes ligados a fontes autorizadas, para apoiar respostas, tarefas e decisões com limites claros e supervisão humana.',
    tags:['Conhecimento','Produtividade','Capacidade'],
    benefits:[{title:'Respostas com contexto',text:'Informação relevante para apoiar o atendimento.'},{title:'Menos interrupções',text:'Conhecimento acessível nas rotinas da equipa.'},{title:'Limites definidos',text:'Avaliação de qualidade e passagem para pessoas.'}],
    deliveries:[{title:'Inteligência artificial',text:'Assistentes orientados pelas fontes da empresa.',href:'/servicos/inteligencia-artificial'},{title:'Automação empresarial',text:'Tarefas e encaminhamentos ligados aos sistemas.',href:'/servicos/automacao'},{title:'Software à medida',text:'Interfaces e integrações para cada operação.',href:'/servicos/software'}],
    note:'Não precisa de organizar tudo primeiro: começamos com um caso de uso e fontes relevantes.',
    alt:'Núcleo de IA 3D conectado a documentos, dados e canais de comunicação empresariais.',
  },
  'marketing-digital': {
    summary:'Combine estratégia, campanhas e páginas de conversão para aproximar a sua oferta do público certo e acompanhar o percurso entre o primeiro contacto e a venda.',
    tags:['Estratégia','Campanhas','Medição'],
    benefits:[{title:'Direção para investir',text:'Prioridades de canais, públicos e mensagens bem definidas.'},{title:'Percurso comercial ligado',text:'Campanhas e páginas alinhadas com o acompanhamento de vendas.'},{title:'Decisões informadas',text:'Indicadores para testar mensagens e ajustar o investimento.'}],
    deliveries:[{title:'Estratégia de canais',text:'Objetivos e públicos alinhados com a oferta.'},{title:'Campanhas pagas',text:'Configuração e acompanhamento dos canais escolhidos.'},{title:'Páginas de conversão',text:'Conteúdo e percursos que facilitam o contacto.'},{title:'Medição e melhoria',text:'Indicadores, testes e revisões do desempenho.'}],
    note:'Gestão e investimento em anúncios são apresentados separadamente. Os canais dependem do diagnóstico.',
    alt:'Dashboard 3D de campanhas digitais com gráficos e um funil de conversões ilustrativo.',
  },
  'desenvolvimento-web': {
    summary:'Apresente a sua oferta com clareza através de websites, lojas e aplicações responsivas, desenhados para facilitar a navegação, o contacto e a ligação aos seus processos.',
    tags:['Experiência','Desenvolvimento','Integração'],
    benefits:[{title:'Uma presença coerente',text:'Conteúdo e design à altura da sua empresa.'},{title:'Utilização em qualquer ecrã',text:'Percursos adaptados a computador, tablet e telemóvel.'},{title:'Próximos passos claros',text:'Navegação orientada para contacto, compra ou utilização.'}],
    deliveries:[{title:'Estrutura e conteúdo',text:'Hierarquia de páginas e ações prioritárias.'},{title:'Interface responsiva',text:'Protótipos e layouts ajustados aos dispositivos.'},{title:'Desenvolvimento e integrações',text:'Funcionalidades e ligação aos sistemas acordados.'},{title:'Validação e lançamento',text:'Acessibilidade, desempenho e percursos essenciais.'}],
    note:'Gestão de conteúdos, alojamento e manutenção são definidos na proposta, com custos identificados antes do desenvolvimento.',
    alt:'Website e aplicação em painéis 3D responsivos de computador, tablet e telemóvel.',
  },
  'seo': {
    summary:'Melhore a descoberta do seu website nos motores de pesquisa com uma base técnica consistente, conteúdo útil e organização alinhada com as perguntas do seu público.',
    tags:['Pesquisa orgânica','Conteúdo','Visibilidade'],
    benefits:[{title:'Descoberta mais simples',text:'Menos obstáculos técnicos à indexação do website.'},{title:'Conteúdo relevante',text:'Temas alinhados com a intenção de pesquisa.'},{title:'Evolução acompanhada',text:'Leitura de tráfego, pesquisas e conversões.'}],
    deliveries:[{title:'Auditoria técnica',text:'Indexação, navegação, metadados e estrutura.'},{title:'Intenção de pesquisa',text:'Temas e perguntas ligados à oferta.'},{title:'Conteúdo e organização',text:'Páginas claras e ligações internas úteis.'},{title:'Acompanhamento orgânico',text:'Indicadores para rever prioridades e melhorias.'}],
    note:'Não garantimos posições, prazos ou citações em respostas de IA. A evolução orgânica depende de vários fatores.',
    alt:'Resultados de pesquisa em 3D com posição destacada e indicadores de visibilidade orgânica.',
  },
  'automacao': {
    summary:'Automatize rotinas e ligue as ferramentas que já utiliza, com fluxos desenhados a partir dos seus processos, validação de dados e tratamento explícito das exceções.',
    tags:['Workflows','APIs','Fiabilidade'],
    benefits:[{title:'Menos trabalho repetido',text:'Informação encaminhada entre as ferramentas da equipa.'},{title:'Processos compreensíveis',text:'Regras, responsáveis e pontos de passagem claros.'},{title:'Controlo das exceções',text:'Falhas previstas, alertas e intervenção quando necessária.'}],
    deliveries:[{title:'Mapeamento de processos',text:'Entradas, decisões e responsabilidades identificadas.'},{title:'Integração de ferramentas',text:'APIs e ligações conforme os acessos disponíveis.'},{title:'Fluxos e validação',text:'Regras de execução e tratamento de erros.'},{title:'Documentação e suporte',text:'Orientações para acompanhar e manter os fluxos.'}],
    note:'Validamos os acessos e testamos cenários representativos antes da ativação. O âmbito define a manutenção.',
    alt:'Workflow 3D com APIs, base de dados e sistemas ligados por conectores de automação.',
  },
  'inteligencia-artificial': {
    summary:'Aplique IA a uma necessidade concreta: encontrar informação, preparar respostas e apoiar tarefas, com fontes autorizadas, avaliação de qualidade e passagem para a equipa quando necessário.',
    tags:['Assistentes','Dados','Supervisão'],
    benefits:[{title:'Conhecimento mais útil',text:'Fontes relevantes acessíveis no contexto do trabalho.'},{title:'Capacidade para responder',text:'Apoio à preparação e classificação de informação.'},{title:'Atuação responsável',text:'Limites claros e supervisão nas decisões importantes.'}],
    deliveries:[{title:'Caso de uso',text:'Necessidade, objetivos e critérios de avaliação.'},{title:'Preparação de fontes',text:'Seleção e organização do conhecimento autorizado.'},{title:'Assistentes e integrações',text:'Ligação aos canais e sistemas acordados.'},{title:'Avaliação contínua',text:'Testes de qualidade, limites e passagem humana.'}],
    note:'A IA pode errar. Fontes, permissões, fornecedores, tratamento de dados e custos de utilização são acordados antes da implementação.',
    alt:'Rede neural 3D abstrata com agentes geométricos e dados a atravessar camadas de processamento.',
  },
  'software': {
    summary:'Construa a ferramenta de que a sua operação precisa: plataformas, CRM, ERP e dashboards ajustados aos processos da empresa, com integrações, permissões e evolução planeada.',
    tags:['À medida','Modular','Integrado'],
    benefits:[{title:'Ajustado à operação',text:'Funcionalidades definidas a partir de processos reais.'},{title:'Sistemas que comunicam',text:'Dados e ferramentas ligados com regras claras.'},{title:'Evolução sustentável',text:'Prioridades validadas antes de alargar o âmbito.'}],
    deliveries:[{title:'Diagnóstico e protótipo',text:'Requisitos, percursos e validação antes de construir.'},{title:'Plataformas empresariais',text:'CRM, ERP e dashboards conforme a necessidade.'},{title:'Integrações e permissões',text:'Acessos e ligações aos sistemas existentes.'},{title:'Validação e entrega',text:'Testes, documentação e orientação para a equipa.'}],
    note:'Âmbito, propriedade do código, alojamento e manutenção ficam sempre claramente definidos na proposta.',
    alt:'Plataforma empresarial 3D modular com blocos de CRM, ERP e dashboards interligados.',
  },
};
