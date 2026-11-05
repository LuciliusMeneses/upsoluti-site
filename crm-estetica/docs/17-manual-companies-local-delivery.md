# Cadastro manual de empresas — implementação local

2026-11-05. Pedido do usuário: cadastro manual na plataforma, com nova conta ou conta existente para o proprietário. Plano em `16-manual-companies-plan.md`. Esta etapa está **implementada e validada localmente**, sem migração remota, alteração da demonstração, commit/push ou novo deploy.

## Comportamento

`/platform` → Empresas e assinaturas → **Nova empresa**. Formulário contém nome, primeira unidade, plano publicado/versionado, país, idioma, moeda, fuso e proprietário. Opções: **Vincular conta existente** (conta com acesso confirmado, senha preservada) ou **Criar nova conta** (e-mail e senha inicial de 12–128 caracteres, sujeita à política Auth).

Empresa, unidade, vínculo owner, assinatura/snapshot e auditorias são gravados numa transação. Avaliação usa os dias do plano; sem avaliação, assinatura começa pendente, sem alegar pagamento. O operador global não se torna membro da empresa, e uma conta de operador global ativo não pode ser usada como proprietário neste fluxo. Mantido o limite de segurança de dez estabelecimentos por proprietário, serializado com o provisionamento existente.

Campos e fechamento ficam bloqueados durante envio. Erros definitivos permitem correção; resultado incerto preserva a mesma solicitação para repetir com os mesmos dados. Navegação para fora da página alerta após uma tentativa pendente. Após sucesso, o formulário limpa campos e atualiza a listagem. Não há envio de e-mails, alteração da senha de conta existente ou ativação financeira automática.

## Servidor e fronteiras

- Migration **009_manual_companies.sql**, aditiva. `private.company_provision_requests` armazena solicitação/payload sem senha e fingerprint opaco; sem acesso direto anônimo/autenticado. Funções com search_path vazio e grants explícitos.
- `platform_prepare_company`: confirma operador global no banco, tipos/região/plano/e-mail/modo, conta existente ou marca de nova conta, idempotência por ator/chave e limite de 20 preparações por hora. Não fornece pesquisa pública de usuários.
- `POST /api/platform/company`: exige origem exata, bearer validado por `auth.getUser` e `platform_access`, JSON limitado a 8 KB e campos aceitos. O cliente administrativo só é criado depois de autorização e preparação persistente. Retorna somente tenant_id ou erro público conhecido; não registra corpo/senha/tokens em logs.
- Nova conta é criada por Auth administrativo com acesso liberado administrativamente, sem afirmar que a caixa de correio foi verificada. Metadados administrativos contêm somente a marca da solicitação, nunca a senha. Não muda a política de cadastro público fechado.
- `platform_finish_company`: revalida privilégio/plano/proprietário e a marca administrativa para nova conta; trava o proprietário e conclui a transação. Tentativas repetidas retornam a mesma empresa. Operadores diferentes não reutilizam a mesma solicitação.
- Auth e banco de negócio são serviços separados. Timeout não provoca exclusão automática de usuário: o servidor consulta novamente a marca de provisionamento e retoma. Se a transação empresarial falhar após Auth, a conta pode existir sem vínculo até retomada/revisão. Não alegar atomicidade distribuída.
- Fingerprint HMAC inclui a solicitação e senha em memória, usando segredo administrativo do servidor. Somente o HMAC vai ao ledger. A senha só é enviada ao Auth e permanece temporariamente no formulário/processo; não é persistida em storage do navegador, banco de negócio, metadados ou relatórios.

## Validação realizada

- **86 testes aprovados** em nove arquivos (71 anteriores + 8 de provisionamento SQL + 7 de handler).
- TypeScript/build aprovados; avisos anteriores Zod/bundle >500 KB permanecem sem falha.
- SQL executado em PostgreSQL PGlite com migrations 001–009: papéis, RLS, owner separado do operador, unidade/assinatura/snapshots, plano oculto, revalidação na conclusão, limite do proprietário, payload/fingerprint alterados, nova conta com marca confiável, ausência de acesso confirmado e recuperação sem empresa parcial.
- Handler: nega anônimo/owner antes de criar cliente administrativo; novo acesso somente após preparação; senha ausente dos RPCs/resposta; conta existente sem mutação Auth; erro genérico sem detalhes; resultado incerto não conclui nem apaga conta; senha rejeitada tem erro próprio.
- `npm.cmd run qa:companies:local`: Chromium + handler Node real + PostgreSQL PGlite isolado. Auth e transporte de leitura Supabase **simulados**, sem rede/banco remoto. Formulário em **320/390/768/1440**, sem overflow da página ou do diálogo; rolamento interno mantém campos acessíveis. Ação PT-PT verificada.
- Percursos pelo navegador: conta existente ausente → erro → correção → empresa criada sem nova conta; nova conta → transação concluída com resposta perdida simulada → retry → mesma empresa/uma só conta; reload preserva duas empresas e respectivos vínculos/unidades/assinaturas. Operador continua sem vínculo operacional; ledger sem senha. Zero erros JS e pedidos externos inesperados. Evidências em `docs/qa-manual-local/results.json` e capturas da mesma pasta; captura 390 px inspecionada visualmente.

## Arquivos e execução

Principais arquivos: `web/src/Platform.tsx`, `web/src/ManualCompanyForm.tsx`, `web/server/company-handler.mjs`, `web/api/platform/company.mjs`, migration 009, testes e `web/scripts/qa-manual-companies-local.mjs`.

`npm run qa:companies:local` faz build e QA isolado; depende de Playwright/Chromium na raiz do workspace, como o QA existente. Para desenvolvimento conectado, Vite 3220 encaminha `/api/platform/company` para 3223. `npm run dev:platform` exige `SUPABASE_SERVICE_ROLE_KEY` somente no processo do servidor; nunca definir prefixo VITE nem colocar a chave em arquivos públicos.

## Checkpoint para publicação em testes

Após autorização específica, verificar que apenas 009 está pendente, aplicar no Supabase exclusivo e configurar **SUPABASE_SERVICE_ROLE_KEY como Secret runtime** no projeto Vercel `crm-estetica-test`. Essa credencial é privilegiada, usada somente pelo endpoint administrativo após autenticação e validação de operador. Preservar `CRM_PUBLIC_ORIGIN`, variáveis públicas e perfil sem e-mails. Nunca imprimir ou incluir a chave em artefatos, CLI args, screenshots ou memórias.

Revisar manifesto, publicar e validar Auth/PostgREST/PostgreSQL/Vercel reais com fixtures exclusivas, incluindo login efetivo do novo proprietário e conta existente, negativa para usuário comum, retry/concorrência, falha parcial, papéis/assinatura/auditoria e limpeza. Remover ledger de QA antes do tenant e remover somente contas criadas para a execução. Preservar contas, planos e demonstrações permanentes.

O último deploy verificado continua sendo o da etapa 008. Esta entrega não comprova criação de conta Auth real ou concorrência entre conexões remotas. Não inclui alteração/exclusão de empresas, transferência de propriedade, fila de solicitações pendentes ou troca obrigatória de senha no primeiro acesso. Se o formulário for fechado após resposta incerta, consultar a listagem antes de iniciar outro cadastro; a chave de retomada fica somente em memória. Rotação do segredo administrativo muda fingerprints e exige revisar solicitações pendentes. Nenhuma senha de acesso existente foi copiada para este documento.
