# Página pública e agendamento — validação local

2026-11-05. O usuário retomou o CRM e escolheu concluir página pública e agendamento online. Aplicados contexto/engenharia locais e instruções do projeto. Sem execução de pipeline ou subagentes.

## Resultado e escopo

Retomado o código existente da etapa 13: página `/clinica/<slug>`, configuração pelo proprietário/gestor, catálogo e profissionais explicitamente selecionados, slots do mesmo motor da agenda interna e reservas sem conta do cliente. `public_page` e `online_booking` são direitos independentes de plano; reservas também exigem Agenda e Clientes. Suspensão por fim da assinatura preserva configuração/histórico. Sem cobrança ou envio de e-mails.

Nesta retomada, o handler passou a aceitar somente códigos públicos conhecidos de erro. Respostas inesperadas do RPC, incluindo nomes herdados de Object.prototype, viram HTTP 503 com mensagem genérica. Incluídos testes de payload inválido/grande e dos conflitos nos dois sentidos entre agenda interna e pública. Testada também tentativa direta de reserva após expiração, sem criação de cliente/atendimento.

Criado `web/scripts/qa-public-local.mjs`, executado por `npm run qa:public:local`. O script sobe PostgreSQL PGlite em memória com migrations 001–008, papéis e fixtures sintéticas; executa o handler Node real pelo navegador e serve o build em porta local dinâmica. Somente o transporte Supabase de leitura é interceptado para chamar esse PostgreSQL. Não conecta ao banco remoto nem utiliza credenciais administrativas. O banco é descartado ao terminar. Requer Playwright/Chromium disponíveis no node_modules da raiz deste workspace, como nos scripts de QA existentes.

## Evidência observada

- `npm.cmd test`: **71 testes aprovados**, sete arquivos. Cobrem fundação/comercial/operação/negócio e página pública/endpoint, com PostgreSQL local para regras SQL.
- `npm.cmd run qa:public:local`: TypeScript/build aprovados; Chromium em **320, 390, 768 e 1440 px**, com quatro reservas persistidas no banco isolado e quatro comprovantes. Seleção de serviço/profissional/data/horário, dados/consentimento, confirmação, troca PT-BR/PT-PT e página não publicada verificados.
- Sem erros JavaScript, overflow horizontal ou pedidos externos inesperados nos percursos testados. Fontes externas bloqueadas no QA; nenhum endpoint remoto de envio de e-mail acessado.
- Screenshots de formulário/comprovante e resultados em `docs/qa-public-local/`; inspeção visual de formulário em 390/1440 px realizada.
- Avisos existentes de comentários Zod e bundle compartilhado >500 KB permanecem, sem falha de build.

## Estado e limites

**Entrega validada localmente; não publicada por esta retomada.** A migration 008 está presente localmente e foi executada no PGlite. A última evidência registrada do remoto era 001–007; este trabalho não consultou nem alterou o histórico remoto. Nenhum plano ou registro demonstrativo persistente foi modificado. Sem commit/push.

O QA do navegador não constitui teste da infraestrutura Supabase/Auth/PostgREST/Vercel. O editor de configuração foi compilado e a gravação/autorização SQL foi testada; sua UI autenticada ainda precisa do ciclo remoto. Os testes de ocupação são sequenciais: não alegar concorrência real entre conexões PostgreSQL. PT-PT foi verificado como idioma/formatação e comprovante; não representa auditoria editorial integral de todas as frases.

## Próximo checkpoint: publicação no ambiente de testes

Após autorização específica, verificar o estado remoto antes de aplicar qualquer migração. Publicar somente no projeto `crm-estetica-test`, preservando a demonstração e o histórico. Revisar migration 008 e aplicar pelo histórico Supabase; gerar capacidade aleatória de 64 caracteres, persistir somente o hash em `private.booking_gateway_config` e guardar a chave fora do frontend e dos relatórios. Configurar no runtime Vercel `CRM_BOOKING_GATEWAY_KEY`, `CRM_PUBLIC_ORIGIN` (origem exata), `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A capacidade não é service_role e não concede operações gerais no banco.

Para desenvolvimento conectado, `npm run dev` usa 3220 e encaminha `/api/booking` para 3221. `npm run dev:booking` precisa do arquivo local ignorado `../.local/booking-server.json` com `project` esperado e `key`; este arquivo não foi criado nesta retomada. Não usar a chave sintética do QA no ambiente remoto.

Antes de confirmar a publicação: testar configuração autenticada, independência dos dois recursos, suspensão/republicação, reserva pelo endpoint real, conflito concorrente interno/público, retry, rate limit, agenda interna/histórico/exportação, quatro larguras e ausência de chamadas de e-mail. Fixtures novas devem ser claramente identificadas e removidas sem tocar na demonstração permanente. Não habilitar os recursos no plano demonstrativo nem publicar conteúdo de clínica sem incluir essa alteração no escopo autorizado.
