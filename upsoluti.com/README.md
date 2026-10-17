# UPsoluti

## Desenvolvimento

Node.js 20+ e dependências instaladas: npm run dev.

Verificações: npm run lint, npm run typecheck, npm test e npm run build. Execute todas com npm run check.

## Integrações

Copie .env.example para .env.local e configure CONTACT_WEBHOOK_URL (HTTPS). O destino deve guardar o pedido e responder com 2xx apenas após a receção. CONTACT_WEBHOOK_TOKEN é enviado como Bearer no servidor; nunca utilize NEXT_PUBLIC para segredos. Sem webhook, o formulário responde com indisponibilidade e mantém os campos preenchidos. Teste a entrega no CRM antes da publicação.

NEXT_PUBLIC_BOOKING_URL permite apresentar o agendamento após envio confirmado. NEXT_PUBLIC_SITE_URL deve corresponder ao domínio final.

O endpoint valida campos, limita tamanho, rejeita honeypot e aplica limitação por instância. Para várias instâncias, configure proteção e limites partilhados no gateway. Não regista dados pessoais nos logs.

## Medição

Eventos locais: upsoluti:analytics, com event e properties em detail. Eventos: contact_clicked, lead_submitted e booking_clicked. Nenhum fornecedor externo de analytics é instalado. Integre a ferramenta escolhida depois de definir a política de consentimento aplicável.

## Conteúdo a validar

Os números dos casos originais não têm comprovação no repositório: foram retirados da apresentação pública e os cenários são identificados como ilustrativos. Os gráficos das soluções usam exemplos fictícios, assinalados no próprio conteúdo. Substitua por casos aprovados e capturas autorizadas. Reveja também afirmações e métricas nas páginas institucionais e de serviços antes da publicação.

A página de privacidade descreve esta implementação. Complete os dados do responsável, fornecedores, conservação e procedimentos de acordo com a operação real antes de publicar. Não é uma declaração de conformidade.

## Hero e proposta

Hero centralizado e secção de proposta adaptados da estrutura visual de https://growthclick.co/, com identidade e conteúdo da UPsoluti. Não são utilizados os logótipos, avaliações ou certificações da referência. O diagnóstico continua disponível num bloco recolhível após o processo.

O formulário completo em /contacto inclui empresa e faixa de investimento, além de telefone e website opcionais. A home usa o contacto inicial com nome, e-mail, objetivo e mensagem. Estes campos são validados no servidor e encaminhados no mesmo webhook. O website é normalizado para URL HTTP/HTTPS. Os valores da faixa indicam o investimento previsto no projeto, sem promessa de preço.

## Páginas internas

As páginas de soluções partilham SolutionPage e dados em src/lib/solutions.ts. Serviços usam src/lib/services.ts. Os blocos comuns estão em InnerUI; estilos internos em src/app/inner.css. O formulário completo mantém o endpoint existente, sem ativar uma integração de CRM.

## Gráficos e animações

AnimatedDiagram usa SVG e CSS para representar percursos comerciais, automação e conhecimento. Os gráficos são conceptuais, sem métricas reais. Cada um tem pausa individual, suspensão fora do ecrã e quando a aba fica oculta; prefers-reduced-motion apresenta a versão estática. CardMotion aplica entrada única e destaque de interação aos cards, sem alterar o hero. Estilos em src/app/motion.css.

## Atendimento IA

O chat usa 9Router, com o combo Atendente definido em NINEROUTER_MODEL. Configure NINEROUTER_URL e NINEROUTER_KEY apenas no servidor (.env.local). Aceita a URL base ou terminada em /v1. Nunca exponha a chave em variáveis NEXT_PUBLIC.

Requer Node >=22.13 e disco persistente para CHAT_STORAGE_PATH (padrão .data/chat.sqlite). Faça backup privado desse diretório; não o publique nem o inclua no Git. Para hospedagem sem disco persistente ou várias instâncias, adapte o armazenamento para uma base partilhada antes de publicar. O histórico expira em 30 dias (CHAT_RETENTION_DAYS, entre 1 e 90), com limpeza durante o uso. O visitante pode exportar e apagar a conversa.

O CRM continua pendente. Pedidos confirmados ficam em chat_leads no SQLite com estado pending. Configure CHAT_LEAD_WEBHOOK_URL e, se necessário, CHAT_LEAD_WEBHOOK_TOKEN para encaminhamento; CONTACT_WEBHOOK_URL é alternativa. Apenas resposta HTTP de sucesso marca o pedido como synced. O webhook recebe uma chave Idempotency-Key que o destino deve respeitar. Sem integração, o chat oferece envio por e-mail e informa que o pedido está apenas guardado. NEXT_PUBLIC_BOOKING_URL permite indicar uma página HTTPS para agendamento.

Não recolha dados sensíveis no chat. Restrinja acesso ao ficheiro SQLite e aos backups. A chave nunca é enviada ao navegador.
