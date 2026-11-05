# CRM Estética — Aura (nome provisório)

**Versionamento — 2026-11-05:** código, testes, documentação, referências e migrações001–011 incluídos no primeiro commit local do CRM dentro do repositório do workspace (`upsoluti-site`). `.local/`, envs preenchidos, dependências/build, configurações locais Vercel/Supabase e evidências geradas `docs/qa*/` permanecem ignorados. Os relatórios anteriores que dizem “sem commit/push” registram o estado de cada entrega; este marco inicia o versionamento, sem envio ao remoto ou nova publicação. Recursos físicos/migração011 continuam somente locais até autorização específica de publicação.

**Recursos físicos — local, 2026-11-05:** salas/cabines/equipamentos por unidade, recursos obrigatórios por serviço, limpeza/manutenção, slots internos/públicos, snapshots e filtro na agenda. Migration011 **não aplicada remotamente**, sem deploy desta etapa. **104 testes/build e QA local Chromium/PGlite aprovados**, Auth/PostgREST simulados; nenhuma demonstração remota alterada. Ler [docs/20-resources-local-delivery.md](docs/20-resources-local-delivery.md) para política de marcações anteriores e checkpoint de publicação. `npm run qa:resources:local` executa o QA isolado.

**Cadastro manual publicado em testes — 2026-11-05:** `/platform` → **Empresas e assinaturas → Nova empresa**, com proprietário existente ou nova conta. Deploy `dpl_AP6ZMgKCL6VooHb2wqYLAdqHNWtc` READY; **001–010 sincronizadas**, 89 testes/build aprovados e QA real online concluído, incluindo login do novo proprietário, concorrência e retomada. Dados de demonstração preservados; fixtures removidas. Publicação e Secret administrativo especificamente autorizados pelo usuário para este projeto de testes. Fonte atual: [docs/18-manual-companies-delivery.md](docs/18-manual-companies-delivery.md). Supera o estado “somente local” preservado abaixo.

**Cadastro manual de empresas — local, 2026-11-05:** botão Nova empresa na plataforma, com criação de conta do proprietário ou vínculo a conta existente. 86 testes, build e QA Chromium/PGlite em quatro larguras aprovados. Migration 009 e endpoint administrativo ainda não publicados/aplicados remotamente; Auth real depende do próximo checkpoint. Fonte: [docs/17-manual-companies-local-delivery.md](docs/17-manual-companies-local-delivery.md). `npm run qa:companies:local` usa banco isolado e Auth simulado; `dev:platform` é o servidor conectado opcional e exige segredo somente no processo servidor.

**Publicado em testes — 2026-11-05:** página pública `/clinica/<slug>` e agendamento online no deploy `dpl_FCYgvi7hZLEswipaUBQbrqTNv28K`, READY em https://crm-estetica-test.vercel.app. Migrações **001–008 sincronizadas**. QA real online de configuração/reserva/concorrência/planos/suspensão/exportação e quatro larguras aprovado, fixtures removidas. Configuração em `/app` → Configurações, conforme recursos do plano; recursos e página não foram ativados automaticamente no plano demonstrativo. Evidências em [docs/15-public-page-delivery.md](docs/15-public-page-delivery.md). Essa publicação substitui o estado local descrito abaixo, preservado como histórico.

**Retomada 2026-11-05:** página pública `/clinica/<slug>` e agendamento online preparados e validados **localmente**, com 71 testes e fluxo Chromium nas quatro larguras. Migration 008 executada somente no PostgreSQL local isolado nesta retomada; sem alteração remota ou deploy. Estado, evidências e preparação do próximo checkpoint em [docs/14-public-page-local-validation.md](docs/14-public-page-local-validation.md). `npm run qa:public:local` faz build e QA sem acessar o banco remoto; `npm run dev:booking` é o servidor conectado opcional e exige capacidade configurada fora do frontend. As descrições anteriores de publicação e número de testes abaixo são histórico do marco 007.

**Direção do produto:** seguir [SAAS-PRODUCT-DIRECTIVE.md](SAAS-PRODUCT-DIRECTIVE.md). A retomada entregou o primeiro núcleo comercial: site do produto, administração global separada, planos versionados, assinaturas manuais e limites de unidades/membros no servidor. Não representa prontidão comercial completa. O núcleo operacional foi revisado e integrado em `006_operations.sql`: serviços, profissionais, disponibilidade, clientes e agenda interna persistente. O rascunho original permanece preservado em `docs/drafts/operations.sql`.

SaaS PT-BR/PT-PT em implementação por fases. Layout baseado nos originais preservados em `referencias/`. Fundação conectada a Supabase exclusivo: autenticação, criação de estabelecimento/unidade e convites com RLS. Agenda interna persistente em `/app`; a prévia pública `/demo` continua ilustrativa. Versão de teste publicada em **https://crm-estetica-test.vercel.app**, sem envio de e-mails, conforme decisão atual do usuário.

## Testar agora — perfil sem e-mails

- Local: http://127.0.0.1:3220. Vercel: https://crm-estetica-test.vercel.app. O desenvolvimento é local; ambos usam o mesmo **Supabase remoto exclusivo de testes**. Não é um banco offline.
- Entrar com uma das contas preparadas: `admin@crm-estetica.test` ou `membro@crm-estetica.test`. Senhas somente no arquivo local ignorado `.local/acessos-teste.txt`, com ACL restrita ao usuário Windows/SYSTEM. Não colocar esse arquivo no código, chat ou Vercel. Essas identidades são sintéticas e não representam caixas de correio verificadas.
- **Contratação:** acesse `/platform` com a conta separada em `.local/acessos-plataforma.txt` e crie/publique um plano com as condições que deseja testar. Nenhum preço permanente foi inventado. Depois entre em `/app` com a conta do estabelecimento (`.local/acessos-teste.txt`), selecione esse plano e crie empresa/unidade/assinatura. Havendo dias de avaliação, inicia avaliação; caso contrário, aguarda ativação manual na plataforma. Convites exigem recurso `team` e assinatura com gravação permitida; a vaga de membro é consumida no aceite. A conta chamada admin do estabelecimento **não** é administradora global.
- `VITE_EMAIL_ENABLED=false`: cadastro público e recuperação por e-mail não aparecem; acesso direto a `/auth/reset` informa que está desativado. Guard de envio impede chamadas desses fluxos. `auth.enable_signup=false` também fecha cadastro público no servidor. Login por e-mail/senha continua habilitado (`auth.email.enable_signup=true`, que nesta CLI controla o provedor de senha). Não foi retirada a exigência de confirmação para abrir cadastro público.
- A aplicação não chama endpoints de envio de mensagens neste perfil. Os endpoints próprios do serviço Supabase não foram removidos; não afirmar bloqueio universal de qualquer envio fora da aplicação. SMTP/entrega real foram **adiados explicitamente pelo usuário**, sem bloquear estes testes.
- Publicação em projeto Vercel separado `crm-estetica-test`, Node 24, sem Git conectado e sem publicação automática do repositório pai. `.vercelignore` exclui envs, scripts administrativos, testes e dependências locais; somente chave pública no build. A URL está no target técnico production desse **projeto de testes**, não representa lançamento comercial.
- Comandos atuais: `npm run build`, `npm test`, `node scripts/qa-commercial.mjs` (requer credenciais de QA somente no processo servidor) e `node scripts/qa-operations.mjs` (mesmos requisitos). **52 testes locais**. Scripts `qa-supabase.mjs` e `qa-no-email.mjs` documentam perfis anteriores à contratação obrigatória e não são a aceitação do marco atual. Relatório atual: `docs/12-business-delivery.md`; relatórios anteriores preservam o histórico.

## Executar

Node 24. Em `web/`: `npm ci`, `npm run dev`. Porta exclusiva **3220** (erro se ocupada). `npm run build` verifica TypeScript e gera `dist/`; `npm test` verifica contratos locais. Rotas SPA: `/` site comercial de teste, `/app` assinante, `/platform` proprietário do SaaS, `/demo` agenda ilustrativa. `/planos` e `/faq` abrem o site; as respectivas seções também possuem âncoras. Links `/auth/*` existentes foram preservados. Navegação interna de cada módulo ainda usa estado local.

## Conectar o ambiente operacional

1. Projeto exclusivo já criado: [crm-estetica](https://supabase.com/dashboard/project/lxzyybcvmlooiyvxmosp), ref `lxzyybcvmlooiyvxmosp`, região `eu-west-1`. Metadados sem segredos em `supabase/project.json`.
2. Migrações **001–007 aplicadas no PostgreSQL remoto** (004 comercial, 005 histórico de assinatura, 006 operação, 007 pacotes/financeiro/relatórios). Não reaplicar manualmente. Futuras alterações usam `supabase db push` com o projeto correto; 006 deriva do rascunho após revisão e testes, com entitlements integrados.
3. `web/.env.local` já contém somente URL e chave pública do novo projeto, ignoradas pelo Git. Nunca colocar service_role ou senha do banco no frontend. A senha do banco foi gerada aleatoriamente e guardada em `.local/supabase-db-password.dpapi`, cifrada pelo Windows para o usuário local.
4. Auth configurado: confirmação de e-mail, mínimo 12 caracteres, alteração segura de senha, refresh token rotation e redirects locais exatos em `supabase/config.toml`. MFA e demais padrões remotos preservados. **SMTP próprio pendente**: preencher uma cópia de `supabase/smtp.env.example` em `.local/smtp.env`, sem enviar credenciais pelo chat. Domínio publicado, SMTP/DNS, rate limits e CAPTCHA precisam de revisão antes do lançamento.
5. Acessar http://127.0.0.1:3220 e clicar em acessar conta. Sem vínculo, onboarding e aceite de convite aparecem; com vínculos, seleção de estabelecimento. Login, recuperação por link gerado, convite e onboarding mobile foram testados com Auth/PostgreSQL reais e contas sintéticas removidas ao final. Recebimento de e-mail ainda não validado.

Sem variáveis, login informa integração não configurada; não existe autenticação fictícia. Demonstração é pública, sintética, em memória e não grava dados operacionais. Idioma persiste somente como preferência local. Perfil demo: Brasil, BRL, America/Sao_Paulo. PT-PT muda vocabulário e formatação, não converte preços nem altera fuso/país da empresa.

## Segurança e permissões

| Operação | Proprietário | Gestor | Receção | Profissional |
|---|---|---|---|---|
| Ler empresa/unidades próprias | Sim | Sim | Sim | Sim |
| Ler os próprios vínculos ativos | Sim | Sim | Sim | Sim |
| Ler auditoria do estabelecimento | Sim | Não | Não | Não |
| Criar estabelecimento próprio (novo owner) | Autenticado | Autenticado | Autenticado | Autenticado |
| Alterar vínculos/configurações diretamente | Não | Não | Não | Não |

Operação atual: proprietário/gestor configuram serviços, profissionais e disponibilidade; receção também mantém clientes e agenda; profissional consulta somente a própria agenda quando sua conta está vinculada, com clientes associados. Todas as mutações exigem direitos de plano no servidor. Relatórios permanecem futuros. RLS e grants protegem as tabelas atuais. `create_establishment` deriva o usuário de `auth.uid()`, exige plano publicado e chave idempotente, e executa empresa/unidade/owner/assinatura/auditoria em transação. Funções privilegiadas têm search_path vazio e grants explícitos. Audit somente leitura; bucket privado, sem políticas de documentos nesta fase. Administração da plataforma implementada com associação global privada independente dos vínculos empresariais; nenhum bypass de suporte exposto.

## Estado real e próximas etapas

Fundação de banco/Auth/convites e primeiro núcleo comercial implementados. Planos criam novas versões; assinaturas preservam snapshots, estado e histórico; proprietário pode exportar a fundação mesmo com assinatura encerrada. Unidades e aceite de membros aplicam quotas em transação. Ativação administrativa não comprova pagamento. SMTP, gateway de cobrança, suporte delegado e indicadores completos da plataforma permanecem futuros. Pacotes, financeiro manual e relatórios da clínica estão disponíveis em testes. Relatórios 02–04 preservam a fundação anterior; 07 registra esta retomada.

Módulos operacionais entregues em testes: disponibilidade no fuso empresarial, agenda interna com conflitos e histórico, clientes/serviços/profissionais. Também entregues: pacotes/sessões, financeiro manual, comissões e relatórios. Pendentes: recursos/cabines, marcação pública e comunicação. Na plataforma já existem planos, assinaturas manuais, contagens atuais, MRR contratado por moeda e auditoria. Permanecem pendentes cobrança automática, pagamentos da assinatura, churn por período, ativação operacional completa e suporte delegado. Ações informativas não são módulos concluídos; não há prontuários clínicos, WhatsApp ou cobrança fiscal.

## Publicação e recuperação

Publicação requer autorização específica. Build estático em `web/dist` exige fallback SPA para index.html e HTTPS. Variáveis VITE são públicas e fixadas no build. Definir CSP e domínios permitidos, SMTP e redirecionamentos Auth antes de produção. Fazer backup PostgreSQL e objetos privados separadamente, manter segredos fora dos artefatos, definir retenção e executar restauração em projeto isolado antes de operar com dados reais. Não há backup/restore nem conformidade legal certificados nesta entrega.

Referências técnicas consultadas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Auth](https://supabase.com/docs/guides/auth), [Vite](https://vite.dev/guide/).

## Convites

Proprietário cria código privado em Configurações → Convites; limite de 20 por hora, somente gestor/receção/profissional, validade 48 horas. Nenhum e-mail enviado. Destinatário autenticado aceita código com e-mail confirmado correspondente. Consumo serializado e único, não sobrescreve vínculo existente. Token somente hash SHA-256 no banco, código mostrado uma vez. Sem convite por URL ou logs. Sem vínculo, aceitação também aparece antes do onboarding.

## Operação interna — 2026-11-04

Plano demonstrativo **Teste — sem cobrança v2** selecionado em Estética Demonstração. Mantidos preço 0 BRL, 1 unidade, 5 membros, 10 profissionais e término da avaliação em 2026-12-04. A versão 1 foi ocultada para novas contratações e preservada no histórico. Nenhum serviço, profissional, cliente ou horário comercial foi presumido para essa empresa.

Para testar: Serviços → cadastrar preço/duração/preparação; Equipe → profissional e serviços habilitados; Equipe → intervalos semanais da unidade **e** do profissional; Clientes → ficha; Agenda → nova marcação. O servidor calcula as vagas, exige instantes com offset e revalida na gravação. Marcações preservam preço/duração, motivos e autor das mudanças. Cancelamentos liberam a vaga e preservam a marcação. Configurações permite exportação da fundação e da operação mesmo após encerramento.

Nesta versão, editar/remover intervalos semanais existentes exige tratar antes todas as marcações futuras do estabelecimento. Bloqueios são informados em UTC, claramente identificado, e exibidos no fuso da empresa. Não são oferecidas sessões que atravessem uma mudança de offset. Listas de configuração são limitadas a 1.000 registros com aviso; clientes paginam 50 e calendário limita 1.000 por consulta. Sem agenda pública ou conclusão clínica. Conclusão operacional, registro manual de recebimentos e comissões estão disponíveis após 007. Detalhes e evidências em `docs/09-operations-delivery.md`.

## Pacotes, financeiro, comissões e relatórios — 2026-11-04

Publicados em `/app`, com Visão geral e dados demonstrativos. Plano Teste — sem cobrança v3 habilita packages/finance/reports, preservando preço/limites/fim2026-12-04. Catálogo de pacotes de um serviço → venda parcelada → concluir atendimento após horário de término → consumir sessão ou gerar cobrança avulsa → registrar recebimento; regras por profissional/serviço geram comissão na conclusão. Estornos/reversões preservam histórico. Todas as ações de negócio novas exigem proprietário/gestor nesta versão e os direitos de plano correspondentes.

52 testes locais e QAreal local/Vercel/4larguras/regressões aprovados; migrações001–007sincronizadas. Comando adicional: `node scripts/qa-business.mjs` com credenciais de QA apenas no processo servidor. Deploy dpl_AAetwMa5jbWtz8JhYXzFEzQaLZt4 READY. Dados fictícios permanentes:3pacotes/vendas/atendimentosconcluídos/comissões,8parcelas,5movimentoscaixa. Não limpar como fixtures.

Financeiro manual, sem movimentação bancária ou emissão fiscal. Pacotes sem múltiplos serviços/reserva antecipada de saldo. Despesas registram pagamento ocorrido, sem contas a pagar futuras. Relatórios distinguem período e posição atual. Exportação completaJSON em Configurações; JSON de indicadores em Relatórios. Sem emails/gateway/agenda pública/suporte delegado. Detalhes, fórmulas e limitações em `docs/12-business-delivery.md`.
