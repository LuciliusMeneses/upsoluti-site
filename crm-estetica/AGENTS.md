# CRM Estética — instruções específicas

Recursos físicos autorizados em 2026-11-05: implementação local, migration011,104testes/build/QAChromiumPGlite aprovados. Ler `docs/20-resources-local-delivery.md`: sem aplicação remota/deploy desta etapa, sem backfill ou mudanças na demonstração. Recursos específicos obrigatórios por serviço/unidade; legado/snapshots preservados, mudanças de associação bloqueadas com marcações vigentes/futuras. Nenhum novo segredo necessário. Último remoto verificado continua001–010/deploy do cadastro manual abaixo.

Estado atual 2026-11-05: cadastro manual de empresas publicado/verificado em testes. Ler `docs/18-manual-companies-delivery.md`: 001–010 sincronizadas, deploy dpl_AP6ZMgKCL6VooHb2wqYLAdqHNWtc READY, 89 testes e QA online7597ec99b8434a aprovados/fixtures removidas. Usuário autorizou especificamente Secret administrativo no runtime de crm-estetica-test após revisão automática inicial; não reutilizar essa autorização em outros projetos. Conflitos determinísticos do novo RPC usam PT409; não reintroduzir40001 nesse caso. Estados somente locais abaixo são históricos.

Cadastro manual solicitado em 2026-11-05: implementação local de Nova empresa com proprietário novo/existente, migration 009 e endpoint administrativo. Ler `docs/17-manual-companies-local-delivery.md` antes de publicar: 86 testes/build/QA local aprovados, Auth simulado, sem migração remota/deploy desta etapa. Segredo administrativo somente no runtime; nunca VITE/frontend/memórias. Não confundir preparação local com o deploy verificado da etapa 008 descrito abaixo.

Estado atual 2026-11-05: publicação autorizada e verificada da página pública/agendamento. Ler `docs/15-public-page-delivery.md`: 001–008 remotas sincronizadas, deploy Vercel de testes READY, QA online real 313165458fc249 com fixtures removidas. Substitui o estado anterior “somente local” abaixo. Plano/dados demonstrativos preservados; não presumir página permanente publicada nem habilitação automática dos recursos no plano existente. Capacidade somente no runtime, nunca VITE/frontend/memórias.

Retomada 2026-11-05: usuário priorizou concluir página pública/agendamento. Ler `docs/14-public-page-local-validation.md`: 008 presente e validada apenas localmente nesta retomada, 71 testes e QA Chromium/PGlite isolado. Não tratar como migration remota aplicada ou funcionalidade publicada. Nenhum dado demonstrativo alterado; próximo checkpoint é autorização específica e validação de infraestrutura no ambiente de testes.

Antes de alterar este projeto, ler [SAAS-PRODUCT-DIRECTIVE.md](SAAS-PRODUCT-DIRECTIVE.md), o briefing em `referencias/briefing.txt` e o estado atual no README/docs. Aplicar também as instruções da raiz do workspace.

- Produto SaaS comercial de assinatura com código único, múltiplas empresas isoladas e três superfícies distintas: site comercial, administração da plataforma e aplicação do assinante.
- Proprietário de estabelecimento não é administrador global. Dados de suporte exigem autorização delimitada e auditoria.
- Separar assinatura paga à plataforma, pagamentos dos clientes ao estabelecimento e comissões dos profissionais.
- Limites de plano, ciclo de vida e permissões devem ser aplicados no servidor; preservar histórico e exportação autorizada, sem exclusões automáticas por inadimplência/cancelamento.
- Preservar PT-BR/PT-PT e configurações próprias por estabelecimento. Não criar instalações ou forks por clínica.
- Distinguir proposta, código local não validado, testes, migração aplicada e deploy verificado. O ambiente atual é de testes sem e-mails e não representa prontidão comercial.
- Pausas do usuário continuam válidas até pedido de retomada. O usuário retomou o desenvolvimento pela base comercial; 004_commercial e 005_subscription_history são a sequência atual. O antigo rascunho da agenda está preservado em `docs/drafts/operations.sql` e não pode voltar à pasta de migrations sem revisão, integração dos direitos de plano e testes próprios.

- Estado atualizado: 006_operations e 007_business revisadas/testadas/aplicadas, 001–007 sincronizadas. Operação, pacotes/sessões, financeiro manual/comissões/relatórios publicados no projeto Vercel exclusivo de testes. Ler docs/12-business-delivery.md para permissões, escopo e limitações. Preservar as duas fases de dados demonstrativos permanentes, incluindo atendimentos históricos fictícios novos; não são fixtures descartáveis.
