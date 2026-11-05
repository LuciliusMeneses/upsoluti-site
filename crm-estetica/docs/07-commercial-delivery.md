# Primeiro núcleo comercial — entrega de testes

2026-11-04. Retomada autorizada pelo usuário após a diretriz de SaaS comercial. Marco escolhido: administração global, planos, assinaturas e direitos no servidor, antes de retomar a operação da clínica. Uma base React/Vite/TypeScript e um Supabase exclusivo de testes para as três superfícies; nenhum fork por empresa.

## Implementado

| Superfície | Entrega |
|---|---|
| Site do SaaS `/` | Apresentação própria, aviso de desenvolvimento, planos publicados do banco, FAQ e links para demo/login. Nenhum preço comercial presumido, depoimento ou métrica fictícia. `/planos` e `/faq` abrem o site com as mesmas seções; navegação por âncoras disponível. |
| Plataforma `/platform` | Login próprio, permissão global separada, visão geral, planos e limites, empresas/assinaturas e últimos 100 eventos de auditoria. Negação explícita para proprietários de estabelecimento sem função global. |
| Assinante `/app` | Contratação por plano publicado, criação atômica de empresa/unidade/owner/assinatura, consulta de direitos e limites, criação de unidade autorizada e exportação JSON da fundação. |
| Demonstração `/demo` | Agenda ilustrativa anterior preservada. Não representa reservas operacionais. Links `/auth/*` anteriores mantidos. |

O layout segue tokens e direção visual das referências, com superfícies claras, verde-petróleo, Inter/fallback, cartões e foco acessível. Preferência PT-BR/PT-PT compartilhada entre as áreas, moeda e fuso independentes. Separação por carregamento de componentes para não inicializar todos os painéis no primeiro acesso.

## Segurança, dados e regras

- `private.platform_operators` define operadores globais. Nome/e-mail/metadados editáveis de um usuário não dão acesso ao SaaS. A conta sintética `plataforma@crm-estetica.test` foi criada separadamente por ferramenta local de servidor; credenciais somente nos arquivos ignorados `.local/platform-access.json` e `.local/acessos-plataforma.txt`, com ACL Windows usuário/SYSTEM. Contas anteriores de estabelecimentos não foram promovidas.
- Plataforma recebe somente metadados comerciais permitidos e contagens de uso da fundação. Não ganha leitura direta das unidades ou dados operacionais por RLS. Não há impersonação ou suporte com bypass. Permissão global é consultada em cada RPC, inclusive após revogação.
- Planos imutáveis por versão: preço inteiro em centavos/cêntimos, moeda, periodicidade mensal/anual, duração de avaliação/carência, quotas de unidades/profissionais/membros e funcionalidades. Publicação/ocultação é separada de alteração das condições. Versões novas não reescrevem contratos antigos.
- Provisionamento exige plano publicado e chave de requisição, amarrada ao ator e payload. Repetição retorna o mesmo ambiente; payload diferente com a mesma chave é rejeitado. Avaliação inicia apenas se configurada no plano; sem avaliação, estado pendente aguarda ativação administrativa. Não ativa uma assinatura paga por retorno do navegador.
- Assinaturas com estado, período, versão concorrente, snapshot do plano e cancelamento agendado. Operador precisa registrar motivo em mudanças. Ativação manual **não comprova pagamento recebido**, não emite fatura e não debita dinheiro.
- Avaliação/período encerrados e cancelamento efetivo bloqueiam novas escritas. Inadimplência usa carência do plano; após o prazo, bloqueia novas escritas. Leitura e exportação autorizadas permanecem. Sem eliminação automática, cancelamento de marcações ou alteração de dados históricos.
- Cotas atualmente operacionais: unidades cadastradas e membros ativos, incluindo proprietário. Banco serializa as gravações por tenant e valida quota no mesmo contexto da inclusão. Aceitar um convite consome vaga; convidar não reserva vaga. Condições comerciais também envolvem as funções de convite existentes, não apenas a UI. Limite de profissionais está preparado no plano, mas sem endpoint operacional desse módulo ainda; não foi declarado como quota de um módulo entregue.
- Histórico captura automaticamente antes/depois das assinaturas no banco (migration005), autor e data. Edição comercial antiga permanece rastreável. Dados da fundação exportados pelo proprietário incluem empresa, unidades, contagem de vínculos, assinatura atual e histórico comercial; não incluem senhas, tokens, convites, e-mails de outros usuários ou dados de outro tenant. Download é um Blob temporário no navegador após RPC autenticada; não existe arquivo público persistente.
- Preços, duração de avaliação e carência são preenchidos pelo operador; não foi deixado plano permanente com valores inventados. A proteção máxima de dez estabelecimentos por criador continua sendo limite de segurança do ambiente, não uma quota vendida.

## Indicadores e separação financeira

MRR é a soma dos preços recorrentes das assinaturas efetivamente ativas, normalizados por periodicidade e agrupados por moeda. Avaliações, pendentes, canceladas e períodos expirados não entram. A normalização é feita em `numeric` no PostgreSQL; a apresentação arredonda apenas para exibição. Não representa caixa recebido e não mistura moedas, receitas dos tratamentos ou comissões.

Empresas, assinaturas ativas, avaliações, atenção comercial, unidades e vínculos vêm do banco. Cancelamentos exibem apenas a contagem atual de estado efetivo; não são apresentados como taxa de churn por período. Ativação completa, ocupação, profissionais, sessões e indicadores financeiros das clínicas ainda não são métricas entregues.

## Validação e publicação

- `npm run build`: TypeScript e Vite aprovados. Avisos não bloqueantes de comentários em Zod e tamanho do bundle compartilhado permanecem; não foi feita certificação de desempenho.
- `npm test`: **3 arquivos / 24 testes aprovados**. PostgreSQL local PGlite verifica permissão global distinta, acesso direto negado, provisionamento idempotente, quotas, snapshots, avaliação expirada, carência encerrada, cancelamento agendado/efetivo, downgrade sem apagar registros, exportação, revogação de operador e rejeição de centavos fracionários.
- `scripts/qa-commercial.mjs`: Auth/PostgreSQL remotos e Chromium reais. Fluxo comercial local run `97f5ee3282824d`; Vercel final run `927d3ac9af2449`, já com histórico005 e isolamento operacional do operador incluídos nas asserções. Testa criação de plano pela UI, contratação mobile, quotas de unidades e membros com duas requisições simultâneas e apenas uma vaga, versões imutáveis, alteração/cancelamento administrativo com motivo, MRR separado de caixa e leitura/exportação após cancelamento. A suíte local PGlite também cobre o histórico005. Zero chamadas de envio de e-mails e erros JS. Quatro larguras na plataforma (320/390/768/1440), site320 e assinante390.
- `tests/browser-qa.cjs`: regressão online da demo/PT-PT em 320/390/768/1440, sem overflow da página e com login configurado. Resultados em `docs/qa/vercel-results.json`. As capturas do novo núcleo estão em `docs/qa-commercial/`; revisão visual realizada.
- O primeiro QA local mostrou que a lista da plataforma precisava atualizar ao alternar seção após outra conta criar uma empresa. Adicionados refetch ao trocar de seção e botão Atualizar dados; percurso completo repetido e aprovado. Uma verificação TypeScript identificou import de tipo após extração do hook de idioma; corrigido antes da publicação. Não confundir tentativas iniciais com o resultado final.
- Migrations **004_commercial** e **005_subscription_history** aplicadas somente no Supabase `lxzyybcvmlooiyvxmosp`; 001–003 preservadas. Rascunho da agenda movido integralmente para `docs/drafts/operations.sql`, não aplicado.
- Vercel projeto **crm-estetica-test**, deploy **dpl_6L5DYf86rakz6yGbEn6xNy1mSBPu**, Ready, alias **https://crm-estetica-test.vercel.app**. Target técnico production apenas do projeto de testes, sem lançamento comercial. Publicação manual, sem Git conectado, commit ou push. Dry-run revisou20 arquivos e exclusão de envs, credenciais, scripts administrativos e testes. Nenhum segredo de servidor no frontend ou na Vercel.

As fixtures sintéticas de cada QA (planos, empresas, assinaturas, vínculos e contas transitórias) foram removidas por IDs/código exclusivos da execução, sem apagar os registros do usuário. Contas permanentes anteriores e operador dedicado foram preservados. Preços visíveis em capturas de QA são exemplos sintéticos removidos; não são condições comerciais publicadas permanentes.

## Limitações e próximo marco

O núcleo comercial é uma entrega de testes, não o produto SaaS inteiro. Ainda faltam agenda e demais operações da clínica, gateway/cobranças/pagamentos da assinatura, suporte delegado autorizado, exportação dos futuros módulos, onboarding operacional completo, churn e utilização por período, paginação/escala da administração, revisão de segurança de produção, backup/restore e testes de carga/acessibilidade completos. A edição manual usa uma data de fim explicitamente futura; fluxos comerciais mais avançados de ajuste retroativo/estorno e recuperação de pagamento ainda não existem.

SMTP e cadastro público seguem desativados por decisão do usuário; contas de teste são previamente provisionadas sem envio. Próximo marco recomendado: retomar serviços/profissionais/clientes/agenda usando o contexto de assinatura e a validação central de direitos em cada gravação. Não copiar/aplicar o rascunho operacional sem revisão desses pontos.
