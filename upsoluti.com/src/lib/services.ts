export interface ServiceDetail {
  name: string;
  title: string;
  highlight: string;
  description: string;
  goal: string;
  overview: string;
  idealFor: string[];
  features: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
}

export const servicesData: Record<string, ServiceDetail> = {
  'marketing-digital': {
    name: 'Marketing digital',
    title: 'Marketing com direção.', highlight: 'Crescimento com contexto.',
    description: 'Ligue campanhas, páginas e acompanhamento comercial para criar um percurso claro até à venda.',
    goal: 'vender-mais',
    overview: 'Começamos pelo que vende, a quem se dirige e onde perde oportunidades. A estratégia combina canais, conteúdo e medição de acordo com a maturidade do seu negócio.',
    idealFor: ['Já investe em campanhas, mas precisa de perceber o retorno.', 'Recebe contactos que não avançam no processo comercial.', 'Quer organizar a aquisição antes de aumentar o investimento.'],
    features: [
      { title: 'Estratégia de canais', desc: 'Objetivos, públicos e mensagens alinhados com a sua oferta.' },
      { title: 'Campanhas pagas', desc: 'Planeamento, configuração e acompanhamento dos canais escolhidos.' },
      { title: 'Páginas de conversão', desc: 'Mensagens e formulários que ajudam o visitante a dar o próximo passo.' },
      { title: 'Medição e melhoria', desc: 'Indicadores claros para acompanhar oportunidades e orientar decisões.' },
    ],
    steps: [{ title: 'Perceber', desc: 'Rever a oferta, os canais e o percurso comercial.' }, { title: 'Planear', desc: 'Definir prioridades, investimento e indicadores.' }, { title: 'Ativar', desc: 'Preparar campanhas, páginas e medição.' }, { title: 'Aprender', desc: 'Testar mensagens e ajustar com base nos dados.' }],
    faqs: [{ q: 'O investimento em anúncios está incluído?', a: 'A gestão e o investimento nos canais são apresentados separadamente. O orçamento de media é alinhado consigo antes da ativação.' }, { q: 'É necessário começar por todos os canais?', a: 'Não. Escolhemos os canais que fazem sentido para o público e para o investimento disponível. O plano pode evoluir à medida que aprendemos.' }, { q: 'Como vamos acompanhar o trabalho?', a: 'A proposta define os indicadores, os acessos e a frequência das revisões. O foco é perceber o que está a acontecer e decidir o próximo ajuste.' }],
    related: ['desenvolvimento-web', 'seo'],
  },
  'desenvolvimento-web': {
    name: 'Websites e aplicações',
    title: 'Uma presença digital.', highlight: 'Pensada para agir.',
    description: 'Websites, lojas e aplicações que apresentam a sua oferta com clareza e facilitam o contacto ou a compra.',
    goal: 'software',
    overview: 'Um bom website ajuda a pessoa certa a encontrar a informação certa. Organizamos o conteúdo, desenhamos os percursos e desenvolvemos a experiência com atenção à utilização em diferentes dispositivos.',
    idealFor: ['O site já não representa a qualidade da sua empresa.', 'Os visitantes têm dificuldade em pedir informação ou comprar.', 'Precisa de uma nova presença digital ligada aos seus processos.'],
    features: [{ title: 'Estrutura e conteúdo', desc: 'Uma hierarquia clara para apresentar a oferta e orientar a navegação.' }, { title: 'Interface responsiva', desc: 'Layouts adaptados a telemóvel, tablet e computador.' }, { title: 'Desenvolvimento e integrações', desc: 'Funcionalidades ajustadas ao âmbito, dos formulários à ligação a sistemas.' }, { title: 'Validação e lançamento', desc: 'Revisão de acessibilidade, desempenho e percursos essenciais.' }],
    steps: [{ title: 'Organizar', desc: 'Definir público, conteúdos e ações prioritárias.' }, { title: 'Desenhar', desc: 'Validar estrutura e protótipos antes de desenvolver.' }, { title: 'Construir', desc: 'Implementar as páginas e funcionalidades acordadas.' }, { title: 'Publicar', desc: 'Testar os percursos e preparar a passagem de conhecimento.' }],
    faqs: [{ q: 'Podemos atualizar o conteúdo depois?', a: 'Sim, quando a gestão de conteúdos faz parte do âmbito. Definimos as áreas editáveis e a formação necessária antes de desenvolver.' }, { q: 'O alojamento e a manutenção estão incluídos?', a: 'São definidos na proposta. Os custos de construção, alojamento, serviços externos e manutenção ficam identificados separadamente.' }, { q: 'Podem melhorar um site existente?', a: 'Sim. Primeiro avaliamos a estrutura e as limitações atuais para perceber se faz sentido evoluir o site ou criar uma nova base.' }],
    related: ['seo', 'software'],
  },
  'seo': {
    name: 'SEO e visibilidade',
    title: 'Seja encontrado.', highlight: 'Pelas pessoas certas.',
    description: 'Melhore a estrutura, o conteúdo e a clareza do seu website para facilitar a descoberta nos motores de pesquisa.',
    goal: 'vender-mais',
    overview: 'A visibilidade orgânica constrói-se com uma base técnica consistente e conteúdo útil. Identificamos os obstáculos à descoberta e priorizamos melhorias com relevância para o seu público.',
    idealFor: ['O site recebe poucas visitas relevantes através da pesquisa.', 'Tem conteúdo, mas falta uma estrutura que o torne fácil de encontrar.', 'Quer reduzir a dependência de campanhas pagas ao longo do tempo.'],
    features: [{ title: 'Auditoria técnica', desc: 'Revisão de indexação, navegação, metadados e problemas de estrutura.' }, { title: 'Intenção de pesquisa', desc: 'Temas e perguntas que ligam a sua oferta às necessidades do público.' }, { title: 'Conteúdo e organização', desc: 'Páginas claras, ligações internas e informação bem estruturada.' }, { title: 'Acompanhamento', desc: 'Leitura de tráfego, pesquisas e conversões para orientar a evolução.' }],
    steps: [{ title: 'Avaliar', desc: 'Identificar obstáculos e oportunidades no domínio.' }, { title: 'Priorizar', desc: 'Escolher temas e melhorias com maior utilidade.' }, { title: 'Melhorar', desc: 'Aplicar ajustes técnicos e de conteúdo.' }, { title: 'Acompanhar', desc: 'Observar a evolução e rever as prioridades.' }],
    faqs: [{ q: 'Conseguem garantir a primeira posição?', a: 'Não. As posições dependem dos motores de pesquisa, da concorrência e de outros fatores. Definimos melhorias e indicadores acompanháveis, sem garantir uma posição.' }, { q: 'Quando se começam a notar mudanças?', a: 'O prazo varia com o ponto de partida, a concorrência e o ritmo de implementação. O diagnóstico permite definir expectativas e uma sequência de trabalho realista.' }, { q: 'Também consideram a pesquisa através de IA?', a: 'Podemos trabalhar a clareza, a estrutura e a consistência das informações relevantes para esses sistemas. A inclusão ou citação em respostas de IA não é garantida.' }],
    related: ['desenvolvimento-web', 'marketing-digital'],
  },
  'automacao': {
    name: 'Automação empresarial',
    title: 'Ligue os sistemas.', highlight: 'Liberte a equipa.',
    description: 'Automatize tarefas repetitivas e faça a informação circular entre as ferramentas que já utiliza.',
    goal: 'automatizar',
    overview: 'Antes de automatizar, percebemos o processo. Identificamos entradas, decisões e exceções para construir fluxos que a sua equipa consegue compreender e acompanhar.',
    idealFor: ['Copia os mesmos dados entre várias ferramentas.', 'Pedidos e oportunidades ficam dependentes de lembretes manuais.', 'Precisa de mais consistência entre a operação e o acompanhamento comercial.'],
    features: [{ title: 'Mapeamento de processos', desc: 'Uma visão das tarefas, responsáveis e pontos de passagem.' }, { title: 'Integração de ferramentas', desc: 'Ligação entre aplicações, conforme os acessos e capacidades disponíveis.' }, { title: 'Fluxos e exceções', desc: 'Regras de execução, validação de dados e tratamento de falhas.' }, { title: 'Documentação e acompanhamento', desc: 'Visibilidade sobre o funcionamento e orientações para a equipa.' }],
    steps: [{ title: 'Mapear', desc: 'Escolher um processo concreto e as suas exceções.' }, { title: 'Ligar', desc: 'Validar acessos e possibilidades de integração.' }, { title: 'Testar', desc: 'Experimentar os fluxos com cenários representativos.' }, { title: 'Acompanhar', desc: 'Ativar alertas e definir a manutenção necessária.' }],
    faqs: [{ q: 'É necessário mudar de ferramentas?', a: 'Nem sempre. Avaliamos as ferramentas atuais e as possibilidades de acesso antes de recomendar uma alteração.' }, { q: 'O que acontece quando uma integração falha?', a: 'O comportamento é desenhado para cada processo: pode incluir novas tentativas, alertas e intervenção humana. Os limites e responsáveis ficam documentados.' }, { q: 'Podemos começar por uma tarefa?', a: 'Sim. Uma primeira automação com âmbito definido ajuda a validar o processo antes de ligar outras áreas.' }],
    related: ['inteligencia-artificial', 'software'],
  },
  'inteligencia-artificial': {
    name: 'Inteligência artificial',
    title: 'IA com contexto.', highlight: 'Utilidade no dia a dia.',
    description: 'Assistentes ligados ao conhecimento da empresa para apoiar o atendimento, a equipa e os processos.',
    goal: 'escalar-ia',
    overview: 'Escolhemos um caso de uso concreto, organizamos as fontes e testamos a qualidade das respostas. A solução inclui limites de atuação e passagem para uma pessoa quando necessário.',
    idealFor: ['A equipa responde repetidamente às mesmas perguntas.', 'O conhecimento está disperso por documentos e sistemas.', 'Quer explorar IA sem começar por uma transformação de toda a operação.'],
    features: [{ title: 'Conhecimento organizado', desc: 'Fontes relevantes, acessos definidos e informação preparada para consulta.' }, { title: 'Assistentes especializados', desc: 'Comportamento e respostas ajustados a uma tarefa bem delimitada.' }, { title: 'Integração com o trabalho', desc: 'Ligação aos canais e ferramentas incluídos no projeto.' }, { title: 'Avaliação e supervisão', desc: 'Testes de qualidade, limites de atuação e revisão humana.' }],
    steps: [{ title: 'Escolher', desc: 'Definir o caso de uso e o que a IA não deve fazer.' }, { title: 'Preparar', desc: 'Organizar conhecimento e autorizações de acesso.' }, { title: 'Avaliar', desc: 'Testar respostas e cenários difíceis antes de ativar.' }, { title: 'Evoluir', desc: 'Rever a utilização e atualizar as fontes.' }],
    faqs: [{ q: 'A IA pode dar uma resposta errada?', a: 'Sim. As fontes de conhecimento e as validações ajudam a reduzir erros, mas não os eliminam. Definimos limites, avaliação e supervisão adequados ao caso de uso.' }, { q: 'O assistente substitui a equipa?', a: 'O objetivo é apoiar tarefas definidas e libertar tempo. A intervenção humana continua prevista para exceções, decisões e situações que exijam contexto adicional.' }, { q: 'Onde são tratados os dados?', a: 'O alojamento, os fornecedores, os acessos e as condições de utilização dos dados são alinhados antes da implementação.' }],
    related: ['automacao', 'software'],
  },
  'software': {
  "name": "Software à medida",
  "title": "Menos tarefas soltas.",
  "highlight": "Mais controlo.",
  "description": "CRM, portais e aplicações internas que ligam os seus dados, a sua equipa e o próximo passo.",
  "goal": "software",
  "overview": "Transforme folhas de cálculo e processos dispersos numa aplicação desenhada para a sua operação. Começamos pelo essencial, com protótipo e entregas validadas consigo.",
  "idealFor": [
    "Informação centralizada, sem perder o contexto.",
    "Responsáveis e próximas ações visíveis.",
    "Regras e acessos ajustados à equipa."
  ],
  "features": [
    {
      "title": "O seu processo, no centro",
      "desc": "CRM, portais e fluxos com as etapas e regras de que a sua equipa precisa."
    },
    {
      "title": "Dados ligados",
      "desc": "Integrações com as ferramentas existentes, após validação técnica dos acessos e APIs."
    },
    {
      "title": "Acesso com responsabilidade",
      "desc": "Perfis de utilizador e permissões definidos para cada função."
    },
    {
      "title": "Entregas que pode validar",
      "desc": "Protótipo, testes dos percursos essenciais e documentação para utilizar o sistema."
    }
  ],
  "steps": [
    {
      "title": "Definir",
      "desc": "Prioridades, âmbito e critérios de aceitação."
    },
    {
      "title": "Prototipar",
      "desc": "Validar os percursos antes de desenvolver."
    },
    {
      "title": "Entregar",
      "desc": "Construir e testar por etapas."
    },
    {
      "title": "Evoluir",
      "desc": "Preparar formação, suporte e próximos passos."
    }
  ],
  "faqs": [
    {
      "q": "Quanto custa e quanto tempo demora?",
      "a": "A proposta parte das funcionalidades e integrações necessárias. Define entregas, calendário e custos de desenvolvimento, alojamento e manutenção."
    },
    {
      "q": "Podemos aproveitar os dados e sistemas atuais?",
      "a": "Avaliamos a qualidade dos dados, as exportações disponíveis e os acessos às APIs. A migração e as integrações são planeadas após essa análise."
    },
    {
      "q": "Quem fica com o código e o suporte?",
      "a": "Propriedade do código, licenças, acessos e condições de suporte ficam definidos no contrato antes do desenvolvimento."
    }
  ],
  "related": [
    "desenvolvimento-web",
    "automacao"
  ]
},};

export function getService(slug: string): ServiceDetail | undefined {
  return Object.prototype.hasOwnProperty.call(servicesData, slug) ? servicesData[slug] : undefined;
}
