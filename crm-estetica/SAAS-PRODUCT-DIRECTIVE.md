# Diretriz central — produto SaaS comercial

Atualização2026-11-05: cadastro manual de empresas na plataforma publicado em testes, com conta existente/nova do proprietário, sem vínculo operacional do administrador global. 009/010 aplicadas,001–010 sincronizadas, QA real/concorrência/login aprovados e fixtures removidas. Fonte `docs/18-manual-companies-delivery.md`. Credencial administrativa no servidor do projeto de testes foi autorizada especificamente; nunca frontend/VITE e sem autorização permanente para outros ambientes. Sem e-mails/cobrança automática ou prontidão comercial.

Atualização de estado 2026-11-05: página por clínica e agendamento público publicados e verificados exclusivamente em testes; direitos independentes `public_page`/`online_booking`, mesmo motor da agenda, gateway restrito, snapshots/consentimento/histórico e isolamento. Migrações001–008 sincronizadas, QA real online e concorrência aprovados. Fonte atual `docs/15-public-page-delivery.md`. Substitui a pendência anterior de agenda pública, sem alterar as diretrizes comerciais e sem habilitar recursos no plano demonstrativo automaticamente. Comunicação, cobrança automática e prontidão comercial continuam pendentes.

Decisão do usuário em 2026-11-04. Este documento governa o projeto e complementa o briefing original em `referencias/briefing.txt`. Em conflito de interpretação, prevalece a orientação atual: produto próprio, reutilizável, comercializado por assinatura para múltiplas empresas independentes. Não tratar o projeto como um CRM feito para uma única clínica. Marca comercial definitiva ainda não foi escolhida; Aura permanece provisória na demonstração.

## Arquitetura e três superfícies

Uma base de código, com separação entre apresentação, domínio, autorização, persistência e integrações. Não criar instalações, repositórios ou versões de código por empresa. Cada contratação provisiona um **ambiente lógico** (tenant/estabelecimento), suas unidades, configurações, assinatura e vínculo inicial do proprietário. Um usuário pode ter vínculos explícitos com diferentes estabelecimentos. Idioma PT-BR/PT-PT, país, moeda e fuso são configurações independentes; identidade comercial do SaaS e identidade do estabelecimento também são separadas.

Rotas-alvo abaixo são uma decisão arquitetural para implementação futura, **não rotas já entregues**. A navegação atual deve ser migrada com compatibilidade dos links de login/testes existentes.

| Superfície | Rotas-alvo | Responsabilidades |
|---|---|---|
| Site comercial da plataforma | `/`, `/planos`, `/faq`, `/demo` | Produto, proposta de valor, planos aprovados, perguntas frequentes e entrada para contratação/cadastro/demonstração. Não inventar preços, depoimentos ou resultados. |
| Aplicação do assinante | `/app/*` | Dashboard operacional, agenda interna e marcações públicas do estabelecimento, clientes/histórico, serviços, profissionais/recursos, pacotes/sessões, financeiro, comissões, comunicação/retorno e configurações/equipe/permissões. |
| Administração do proprietário do SaaS | `/platform/*` | Empresas assinantes, planos/preços/limites/funcionalidades, assinaturas/avaliação/cobrança, onboarding/ativação, métricas recorrentes/uso/cancelamento e suporte autorizado/auditado. |

Marcação pública de cada estabelecimento é um percurso da operação do assinante, distinto do site que vende o SaaS. Deve publicar somente serviços/dados permitidos e usar o mesmo motor de disponibilidade da agenda interna.

## Fronteiras de autorização

- `owner` em `memberships` significa **proprietário do estabelecimento**, nunca administrador da plataforma. Nomes de login como `admin@crm-estetica.test` não concedem privilégios globais.
- Administração global exige uma associação própria de operadores da plataforma, mantida por operações privilegiadas no servidor. Não confiar em nomes, e-mails, parâmetros do navegador ou metadados editáveis pelo usuário para conceder essa função.
- Administrar a assinatura e os metadados empresariais não concede leitura automática de clientes, documentos, notas ou movimentos financeiros do estabelecimento.
- Suporte deve ter chamado, justificativa, escopo, aprovação do responsável da empresa, duração limitada, autor e histórico de acesso. Acesso de leitura é o padrão; escrita exige autorização específica. Revogação e expiração são verificadas em cada operação. Não implementar impersonação irrestrita ou bypass permanente no frontend.
- Dados operacionais continuam isolados por tenant em RLS, consultas, funções, relações, arquivos privados, pesquisas, relatórios, exportações e processos assíncronos. Todo endpoint/RPC privilegiado deve validar a identidade e o vínculo/permissão correspondente.
- Módulos da plataforma não reutilizam os papéis de receção/gestor/profissional como atalhos para acesso global. A conta de serviço nunca entra no bundle do navegador.

## Modelo comercial e contratação

Modelo-alvo, ainda a implementar: catálogo de planos versionados; preços por moeda e periodicidade; limites de unidades/profissionais ativos e funcionalidades; assinatura por estabelecimento com snapshot da versão/condições contratadas; eventos de cobrança e uso; onboarding e suporte. Alterar um plano não reescreve contratos ou períodos históricos silenciosamente.

A contratação deve criar assinatura e ambiente lógico por operação autorizada, transacional e idempotente. Em testes, criação pode ser administrativa/manual e explicitamente identificada. Em cobrança integrada, callbacks do provedor precisam de assinatura validada e proteção contra repetição; não ativar um plano porque o navegador informou pagamento ou visitou uma página de sucesso.

O onboarding deve configurar empresa/região, unidade, serviços, profissionais/disponibilidade e primeira marcação. O progresso é apurado a partir dos registros persistidos, sem confiar em flags de conclusão enviadas pelo cliente. Não exige uma instalação por estabelecimento.

Limites e funcionalidades contratadas são aplicados no **servidor**, incluindo RPCs, importações, processos assíncronos e reservas públicas. Checar a assinatura, o plano e o uso no mesmo contexto transacional da gravação para impedir que pedidos concorrentes ultrapassem limites. A UI apenas antecipa o feedback. Controles atuais de teste não equivalem a direitos de plano comercial.

## Três fluxos financeiros independentes

| Fluxo | Quem paga/recebe | Registros e fronteira |
|---|---|---|
| Assinatura do SaaS | Estabelecimento → plataforma | Plano, assinatura, cobrança e pagamento da plataforma. Não soma aos recebimentos de tratamentos da clínica. |
| Serviços e pacotes | Cliente final → estabelecimento | Venda, cobrança, parcelas, pagamento e reversão ligados ao tenant e ao atendimento/pacote. Não ativam assinatura do SaaS. |
| Comissões | Estabelecimento → profissional | Regra aplicada, base, competência, demonstrativo e liquidação da comissão. Não constituem receita da plataforma. |

Separar fontes, permissões, relatórios e estados dos três fluxos. Usar valores monetários inteiros em centavos/cêntimos, moeda explícita e snapshots das regras. Receita prevista, recebimento, comissão e documento fiscal têm significados distintos. Manter ajustes/reversões rastreáveis; não apagar movimentos confirmados para corrigir erros. Integrações fiscais/comerciais não são presumidas a partir de um recibo interno.

## Política de ciclo de vida

Regras funcionais de referência para implementação. Duração de avaliação, carência, preços e limites específicos permanecem configuráveis e precisam de definição comercial; **nenhum valor foi aprovado por este documento**.

| Estado/evento | Comportamento previsto no servidor | Preservação dos dados |
|---|---|---|
| Avaliação vigente | Liberar recursos e limites da versão de avaliação configurada; prazo calculado no servidor. | Dados pertencem ao tenant; não misturar com a demonstração pública. |
| Avaliação encerrada sem contratação | Bloquear novas gravações operacionais; permitir leitura autorizada, exportação e gestão da própria contratação. | Sem eliminação ou cancelamento automático de marcações existentes. |
| Assinatura ativa | Operação conforme plano, permissões e limites. | Eventos e snapshots preservados. |
| Inadimplência | Carência configurável, com prazo/estado explícitos. Após a carência, leitura/exportação e regularização continuam; novas gravações operacionais ficam bloqueadas. | Não apagar histórico nem registrar como pagas cobranças em aberto. |
| Cancelamento solicitado ao fim do período | Manter os direitos até o fim do período contratado, conforme condições aplicadas; mostrar cancelamento agendado. | Não excluir empresa ou dados por receber o pedido. |
| Cancelamento efetivado | Encerrar novas gravações operacionais; preservar leitura/exportação autorizadas e histórico. | Nenhuma exclusão automática. Políticas futuras de retenção/eliminação exigem processo próprio. |
| Redução de plano com uso acima do limite | Preservar registros existentes e bloquear novas adições que excedam a nova cota; orientar regularização ou upgrade. | Não desativar ou apagar profissionais/unidades automaticamente para ajustar a contagem. |
| Exportação | Proprietário/autorizado solicita exportação restrita ao tenant, com auditoria, minimização e download privado temporário. Não exportar senhas, tokens, segredos nem dados de outras empresas. | Exportar não elimina os dados de origem. |

Estados de cobrança não são um campo livre editável pelo assinante. A administração manual inicial exige operador autorizado e auditoria; a futura integração deve conciliar eventos sem duplicação. Suspensões por segurança precisam de política específica; não criar uma exceção genérica que exponha dados por suporte ou exportação.

## Indicadores da plataforma

- Receita recorrente mensal contratada: normalizar contratos recorrentes ativos para um mês, separar avaliações, encargos únicos e valores em risco por inadimplência. Diferenciar de caixa efetivamente recebido. Não somar moedas diferentes sem política de conversão explícita.
- Cancelamento: distinguir solicitação agendada de cancelamento efetivo; documentar período, base de assinantes pagantes e denominador. Base inexistente deve mostrar ausência de dados, não um resultado inventado.
- Utilização: unidades e profissionais ativos, funcionalidades utilizadas, volumes e consumo por tenant/período, com acesso mínimo necessário. Não usar dados demonstrativos como indicadores comerciais.
- Ativação: acompanhar as etapas persistidas do onboarding. Nenhuma métrica pode ser fixa na UI como substituto de uma consulta real.

## Estado verificado em 2026-11-04

**Entregue/testado anteriormente:** base React/TypeScript/Vite e Supabase de testes exclusivo; estabelecimentos/unidades, Auth, vínculos/papéis do assinante, RLS, convites e onboarding inicial. Perfil sem e-mails, cadastro público fechado, duas contas sintéticas de teste e frontend Vercel identificado como teste. Isso não certifica prontidão comercial.

**Em elaboração local, pausado:** `004_operations.sql` e plano do item 2. A migração foi iniciada antes da pausa e não deve ser considerada revisada, testada ou aplicada até a sua validação específica. Não presumir que a agenda demonstrativa já usa esses registros.

**Ainda não implementado:** administração da plataforma, catálogo de planos/preços, assinaturas e cobrança recorrente, limites comerciais no servidor, suporte delegado, métricas SaaS, site comercial, exportação e políticas de ciclo de vida descritas acima. Os outros módulos operacionais permanecem nas fases do briefing.

O limite fixo de dez estabelecimentos por criador na fundação é uma proteção de teste, **não um plano contratado**. Antes da comercialização, o provisionamento e todas as novas escritas devem integrar as verificações de assinatura/entitlements, inclusive funções existentes. Até lá, não anunciar cobrança, limite comercial ou estados de assinatura como implementados.

## Ordem revisada para orientar a retomada

1. Consolidar a separação entre identidade/permissões da plataforma e do estabelecimento e o modelo de assinatura/limites; impedir que a evolução operacional cristalize regras de uma clínica única.
2. Implementar e validar o núcleo comercial administrativo e suas verificações no servidor, inicialmente com cobrança manual explícita se não houver provedor contratado. Sem inventar preços ou períodos comerciais.
3. Evoluir o item 2 e os demais módulos da aplicação do assinante com contexto de tenant e direitos do plano em cada gravação; manter snapshots e histórico.
4. Construir o site comercial e conectar contratação/onboarding ao provisionamento lógico idempotente da mesma aplicação.
5. Validar ciclo de vida, exportação, auditoria/suporte, isolamento, limites concorrentes e preparação operacional antes de oferecer comercialmente. Cobrança automática, SMTP e demais integrações só são consideradas prontas após configuração e teste próprios.

Essa direção não elimina o trabalho existente nem autoriza executar todas as fases durante uma pausa. A retomada de implementação depende da instrução do usuário; esta revisão é documental, sem migrações remotas ou deploy.

## Atualização após a retomada autorizada — 2026-11-04

O usuário retomou o trabalho pela melhor dependência arquitetural. O primeiro núcleo comercial está implementado: `/` site comercial de teste, `/platform` administração global separada, `/app` assinante e `/demo` demonstração. Planos versionados, assinaturas manuais, direitos/limites de unidades e membros no servidor, provisionamento idempotente, histórico de condições e exportação da fundação. Migrações 004_commercial e 005_subscription_history compõem essa sequência; o antigo rascunho operacional foi movido para `docs/drafts/operations.sql` e não foi aplicado.

Essa atualização substitui o estado anterior de pausa e de ausência completa da administração. Continuam pendentes agenda operacional, catálogo/profissionais/clientes, pacotes/financeiro/comissões, cobrança automática, suporte delegado, métricas comerciais completas e exportação dos futuros módulos. O limite de profissionais é configurável no plano, mas a aplicação operacional dessa cota depende do módulo correspondente. Ambiente permanece de testes sem e-mails e com cadastro público fechado. Evidências e limitações em `docs/07-commercial-delivery.md`.

## Atualização operacional e financeira — 2026-11-04

Estado verificado atual substitui as pendências operacionais anteriores, preservando o histórico: 006_operations entregou agenda/cadastros/disponibilidade; 007_business entregou pacotes de um serviço/sessões/conclusão e reversão, financeiro manual parcelado/estornos/despesas, comissões por conclusão e relatórios/visão geral do estabelecimento. Os três fluxos financeiros permanecem separados, com direitos do plano, papéis, RLS, idempotência e auditoria no servidor. 52testes+QAreal local/Vercel/regressões/4larguras aprovados; 001–007remotas. Plano demonstrativo v3 sem mudar condições/período. Evidências atuais em docs/12-business-delivery.md. Permanecem futuros cobrança automática, comunicação/SMTP, agenda pública, recursos, suporte delegado e métricas completas da plataforma; não afirmar prontidão comercial.
