# Ambiente de teste sem e-mails — local e Vercel

2026-11-04. Usuário esclareceu que não possui SMTP e autorizou desenvolvimento local e testes na Vercel sem e-mails. A decisão substitui a espera por um provedor para encerrar o item 1 neste perfil de testes. Escopo continua restrito à fundação; não houve implementação dos itens seguintes.

## Perfil atual

Desenvolvimento Vite local 3220 e frontend publicado em `https://crm-estetica-test.vercel.app`, ambos usando Supabase de testes `lxzyybcvmlooiyvxmosp`. Não foi feita migração para SQLite/offline nem cópia de dados de outros projetos. Identificação de ambiente de teste visível no login e no shell.

`VITE_EMAIL_ENABLED=false` por padrão. Formulários de cadastro público/recuperação ocultos, acesso direto a reset informa indisponibilidade e a função de submit também bloqueia esses fluxos. Login por senha de contas provisionadas administrativamente funciona. `auth.enable_signup=false` impede criação pública no servidor. `auth.email.enable_signup=true` é necessário para o provedor de login na CLI atual; o QA identificou `email_provider_disabled` quando esse campo também foi fechado. Corrigido e verificado no `/auth/v1/settings`: signup global fechado, e-mail/senha habilitado e autoconfirmação pública desativada.

Duas contas sintéticas persistentes preparadas: admin e membro sob `crm-estetica.test`, sem mensagem ou verificação de caixa postal. Usadas como identificadores de login. Senhas aleatórias guardadas somente em `.local/test-access.json` e `.local/acessos-teste.txt`, ignorados pelo Git, com ACL para usuário Windows/SYSTEM. Conta admin cria seu estabelecimento no primeiro acesso; membro aceita convite de código. Não existe owner global nem acesso a outras empresas sem vínculo explícito. Não foram criadas empresas operacionais de exemplo permanentes.

Não foi instalado SMTP nem configurado remetente, mensagens automáticas ou serviços de campanha. Os testes instrumentaram o navegador para comprovar zero chamadas aos endpoints recover/signup/resend/invite/otp pela aplicação. Não se afirma bloqueio global dos endpoints próprios de envio do Supabase fora da aplicação; configuração comercial e proteção contra abuso continuam futuras.

## Publicação verificada

- Projeto Vercel exclusivo `crm-estetica-test`, ID `prj_SkXl02H1jpgbqn2ov7cjm2pllgaA`, equipe pessoal Hobby, Node 24.
- Deploy `dpl_Hw6ZvwcdTerfQqQSwtRtxcvWAkVh`, **Ready**, target técnico production para disponibilizar alias estável do projeto de testes. Alias `https://crm-estetica-test.vercel.app`. Não é lançamento comercial.
- A criação pela CLI conectou automaticamente o repositório pai; associação foi removida antes do deploy. Sem Git conectado, push/commit ou deploy automático. Somente os 14 arquivos revisados de `web/` foram enviados. Dry-run confirmou exclusão de `.env*`, dependências locais, scripts administrativos e testes. Nenhum arquivo de `.local/` pertence à raiz de publicação.
- Env remoto: URL Supabase, chave **pública anon**, `VITE_EMAIL_ENABLED=false`. Papel da chave JWT validado como anon antes de expor no build. Nenhuma chave de serviço ou senha na Vercel/frontend. Secrets de QA somente na memória do processo local servidor.
- `vercel.json`: fallback SPA, nosniff, no-referrer, frame deny e CSP restrita ao app, fontes e seu Supabase. HTTP 200 e cabeçalhos conferidos. Redirects Supabase incluem somente domínio exato de testes e origens locais existentes.

## Testes executados

- Build/tipos aprovados, 8 testes locais de domínio/PostgreSQL aprovados. Avisos não bloqueantes de comentários Zod, tamanho do bundle e tooling npm registrados no log de build.
- `scripts/qa-no-email.mjs` com Auth/PostgreSQL reais e Chromium: **local** run `6276b38b87eb4038` e **Vercel** run `4073bf02a3a14460` passaram. Provisionamento de contas sintéticas sem e-mail, login real, signup público negado, onboarding persistente, isolamento, convite/aceite de uso único, escalada de papel negada, logout, reset direto bloqueado, zero operações de e-mail ou erro JS. 390 e 1440 px, sem overflow de página. Fixtures de cada execução removidas em transação/cleanup com IDs exatos; duas contas permanentes de teste preservadas.
- `tests/browser-qa.cjs` passou na Vercel em 320/390/768/1440: PT-PT, agenda demo, pesquisa, lista, painel e login disponível. `docs/qa/vercel-results.json`. Agenda continua demonstrativa.
- Capturas sem senhas/tokens em `docs/qa-no-email/`; relatórios JSON correspondentes. Testes anteriores precisaram aguardar a propagação da configuração Auth; não foram considerados aprovados até o percurso final completo.

## Limites

Sem entrega/recuperação por e-mail, cobrança, backup externo, auditoria completa de acessibilidade, teste de carga ou preparação legal para operação comercial. SMTP foi adiado expressamente; ativação futura exige infraestrutura, revisão da política de signup, definição de remetente e teste de entrega. Não basta ligar uma flag no cliente. Local e Vercel compartilham o banco exclusivo de testes; não usar dados pessoais reais.
