export const offeringGuides: Record<string, { fit: string; process: string; example: string; measurement: string }> = {
  'marketing-digital': {
    fit: 'Para empresas que precisam de ligar a divulgação à resposta comercial, perceber de onde chegam os pedidos ou organizar o investimento em canais digitais.',
    process: 'Começamos pela oferta, pelo público e pelo percurso até ao contacto. Definimos os canais, as páginas de destino e a medição antes de testar mensagens. A proposta identifica a gestão e o orçamento de anúncios separadamente.',
    example: 'Uma aplicação possível é ligar uma campanha a uma página específica, registar o pedido no CRM e atribuir um responsável pelo seguimento. É um exemplo de utilização, não um resultado de cliente.',
    measurement: 'Avaliamos contactos qualificados, custo por contacto e evolução comercial quando existem dados disponíveis. Cliques e impressões ajudam a interpretar o percurso, mas não comprovam vendas. Os resultados dependem também da oferta e do acompanhamento.',
  },
  'desenvolvimento-web': {
    fit: 'Para quem precisa de apresentar serviços, receber pedidos, vender online ou disponibilizar uma aplicação com percursos claros em computador e telemóvel.',
    process: 'Organizamos páginas, conteúdos e ações prioritárias. Validamos o desenho antes do desenvolvimento e acordamos integrações, alojamento, gestão de conteúdos e manutenção na proposta. O lançamento inclui a verificação dos percursos essenciais.',
    example: 'Um website de serviços pode encaminhar cada pedido para a empresa e o responsável corretos no CRM, preservando a origem do contacto. A integração depende dos sistemas e acessos disponíveis.',
    measurement: 'Verificamos navegação, formulários, adaptação aos ecrãs e carregamento. Depois do lançamento, as métricas de utilização e contacto permitem priorizar melhorias; um website publicado não garante tráfego ou vendas.',
  },
  'seo': {
    fit: 'Para empresas cujo website precisa de ser mais fácil de descobrir e compreender nas pesquisas relacionadas com os seus serviços.',
    process: 'Transformamos o diagnóstico técnico em prioridades: rastreamento, indexação, URLs canónicas, metadados, navegação e conteúdo. Quando há acesso ao Search Console, cruzamos os problemas observados com os dados reais da propriedade.',
    example: 'Uma página de serviço pode explicar a quem se destina, o que inclui e como decorre o trabalho, com ligações para temas complementares. O objetivo é responder à pergunta do visitante, sem repetir palavras-chave artificialmente.',
    measurement: 'Acompanhamos páginas indexadas, pesquisas relevantes, cliques e contactos quando a medição está disponível. Não garantimos posições, prazos de indexação ou presença em respostas de IA. A evolução depende também da concorrência e dos sistemas de pesquisa.',
  },
  'automacao': {
    fit: 'Para equipas que repetem a introdução de dados, copiam informação entre aplicações ou dependem de lembretes manuais para acompanhar pedidos.',
    process: 'Mapeamos uma rotina, identificamos entradas e responsáveis e verificamos os acessos às ferramentas. Construímos o fluxo com validação, tratamento de erros e intervenção humana nas exceções, antes de alargar a outras tarefas.',
    example: 'Um formulário pode criar um pedido no CRM, atribuir uma tarefa e avisar a equipa. O desenho deve prever reenvios, dados incompletos e indisponibilidade dos serviços, para evitar perdas e duplicações.',
    measurement: 'Comparamos tarefas manuais, tempo de execução e falhas antes e depois, quando existe uma base de medição. O âmbito e a manutenção são acordados; uma integração não elimina a necessidade de supervisão.',
  },
  'inteligencia-artificial': {
    fit: 'Para equipas que precisam de encontrar informação autorizada, preparar respostas ou classificar pedidos, com critérios claros para revisão por uma pessoa.',
    process: 'Escolhemos um caso de uso e as fontes que o assistente pode consultar. Definimos permissões, limites e encaminhamento para a equipa. Avaliamos respostas com exemplos representativos antes de disponibilizar a solução.',
    example: 'Um assistente pode ajudar a localizar uma orientação num conjunto de documentos aprovados e preparar uma resposta para revisão. A utilização depende da qualidade, atualização e autorização dessas fontes.',
    measurement: 'Avaliamos correção, relevância, falhas e situações em que deve pedir ajuda. Não tratamos respostas geradas como decisões finais nem prometemos ausência de erros. Custos de utilização e tratamento de dados devem integrar o âmbito.',
  },
  'software': {
    fit: 'Para empresas cujos processos não cabem nas ferramentas disponíveis ou que precisam de ligar dados, permissões e operações numa aplicação própria.',
    process: 'Definimos requisitos e percursos com quem utiliza o sistema. Um protótipo ajuda a validar prioridades. A implementação é dividida em entregas, com testes e critérios acordados; propriedade do código, alojamento e manutenção constam da proposta.',
    example: 'Um portal interno pode reunir pedidos, responsáveis e estados de trabalho com acesso por perfil. A integração com faturação ou outras ferramentas depende de APIs, licenças e permissões disponíveis.',
    measurement: 'Validamos os percursos essenciais, o acesso aos dados e a recuperação perante falhas. A evolução é priorizada pela utilização e pelas necessidades da operação, sem assumir que toda a funcionalidade deve ser construída de início.',
  },
  'vender-mais': {
    fit: 'Para empresas que recebem visitas ou contactos, mas têm dificuldade em perceber onde se perdem oportunidades entre a divulgação e o seguimento comercial.',
    process: 'Analisamos oferta, canais, páginas e resposta comercial como um percurso único. Escolhemos primeiro o ponto de maior fricção e definimos uma melhoria verificável, em vez de aumentar investimento sem perceber o contexto.',
    example: 'Uma aplicação possível é alinhar uma campanha com a página de destino e entregar o pedido ao CRM com a sua origem, para que a equipa responda com informação relevante.',
    measurement: 'Acompanhamos pedidos relevantes, tempo de resposta e passagem entre etapas, se houver dados disponíveis. Os indicadores orientam testes; não são uma promessa de vendas ou de retorno financeiro.',
  },
  'automatizar': {
    fit: 'Para operações onde a mesma informação é copiada entre departamentos, os pedidos ficam sem responsável ou é difícil perceber o estado de uma tarefa.',
    process: 'Escolhemos um processo delimitado, registamos as regras e identificamos as ferramentas envolvidas. Validamos acessos e exceções antes de construir a ligação, com documentação para a equipa acompanhar o funcionamento.',
    example: 'Um pedido recebido no website pode gerar um registo e uma tarefa para a equipa, com aviso quando falta informação. Esse fluxo deve distinguir uma falha de envio de um pedido já recebido.',
    measurement: 'Observamos consistência dos dados, intervenção manual e ocorrências de erro. A automatização é revista quando os processos ou as APIs mudam; permissões e manutenção fazem parte do desenho.',
  },
  'escalar-ia': {
    fit: 'Para empresas cujo conhecimento está disperso e cuja equipa precisa de apoiar mais pedidos sem perder controlo sobre fontes, acessos e qualidade.',
    process: 'Selecionamos um caso de uso com fontes autorizadas, definimos quem pode consultar o quê e testamos respostas e encaminhamentos. Começamos por um conjunto limitado de informação antes de alargar a outras áreas.',
    example: 'Uma equipa pode usar um assistente para encontrar procedimentos internos e preparar respostas, com passagem para uma pessoa quando as fontes não permitem uma resposta segura.',
    measurement: 'Acompanhamos relevância das respostas, necessidade de correção e encaminhamentos. Ligar documentos a um assistente não equivale a treinar automaticamente um modelo nem garante a qualidade de todas as respostas.',
  },
};
