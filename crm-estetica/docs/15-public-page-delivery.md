# Página pública e agendamento online — publicação em testes

2026-11-05. Autorização explícita do usuário: “publique”. Publicação restrita ao projeto Vercel `crm-estetica-test` e Supabase exclusivo `lxzyybcvmlooiyvxmosp`. Não representa lançamento comercial.

## Entrega publicada

Página por estabelecimento em `/clinica/<slug>`, com apresentação, logotipo raster/cor configuráveis, catálogo/profissionais explicitamente selecionados e agendamento sem conta do visitante. Configuração em `/app` → Configurações → Página pública e marcações online, por proprietário/gestor e conforme os recursos do plano. A página comercial do SaaS e a administração global permanecem separadas.

`public_page` e `online_booking` são recursos independentes. Reservas também exigem Agenda e Clientes; a exposição é suspensa quando a assinatura não permite gravação. O endereço fica reservado e bloqueado após publicação. Suspensão/despublicação preservam configuração, consentimento e histórico. Não habilitamos os novos recursos no plano demonstrativo nem publicamos página permanente da demonstração: condições e dados existentes foram preservados.

Gateway `POST /api/booking` com origem exata, validação de JSON/limites de corpo, capacidade restrita e IP tratado com HMAC. Chave aleatória configurada como **Secret** no runtime, sem prefixo VITE; banco guarda somente o hash. Sem service_role no runtime. Vercel/SDK enviam ao banco apenas os parâmetros necessários. O handler devolve somente erros públicos conhecidos ou mensagem genérica. Contatos não verificados não são mesclados com clientes preexistentes.

## Banco e deploy verificados

- `migration list --linked`: remoto tinha 001–007 e somente 008 pendente. `db push --dry-run` confirmou unicamente `008_public_pages.sql`; aplicação autorizada concluída. Nova consulta confirmou **001–008 sincronizadas**.
- Capacidade configurada em `private.booking_gateway_config`; runtime Vercel recebeu `CRM_BOOKING_GATEWAY_KEY` e `CRM_PUBLIC_ORIGIN`. Variáveis públicas anteriores e perfil `VITE_EMAIL_ENABLED=false` preservados.
- Deploy **dpl_FCYgvi7hZLEswipaUBQbrqTNv28K**, **READY**, alias **https://crm-estetica-test.vercel.app**. Target técnico production do projeto de testes. Função Node `api/booking` confirmada pelo inspect.
- Build remoto/TypeScript aprovados. Manifesto remoto revisado: **30 arquivos fonte**, sem `.env`, `.local`, scripts administrativos, testes ou credenciais. Arquivos de servidor fazem parte da função e não do bundle do navegador. Sem Git conectado, commit ou push nesta entrega.
- `/`, `/app`, `/platform` e fallback `/clinica/...` HTTP 200. `GET /api/booking` 405 esperado; POST válido para slug não publicado 404/unavailable. HTTP 200 do fallback sozinho não significa clínica publicada.

## Validação online

Script `web/scripts/qa-public-online.mjs`, execução **313165458fc249**, resultado em `docs/qa-public-online/results.json`. Auth, PostgREST, PostgreSQL e função Vercel reais; credencial administrativa utilizada somente no processo local para criar/remover contas sintéticas. Nenhuma interceptação de API no Chromium deste QA.

- Proprietário autenticado publicou pelo editor real, selecionando serviço/profissional; gravação/slug bloqueado confirmados. Editor sem overflow em **320/390/768/1440 px**.
- Página pública carregou catálogo selecionado nas quatro larguras; novo visitante reservou pela UI e recebeu comprovante opaco. Banco confirmou preço/duração, origem online, autor público e histórico. Mesmo contato de cliente anterior criou cadastro separado.
- Repetição da mesma solicitação devolveu o mesmo comprovante; alteração do conteúdo com a mesma chave foi rejeitada. PT-PT do comprovante verificado nas quatro larguras.
- Concorrência real entre conexões: disputa **agenda interna × pública** e **pública × pública** criaram exatamente um atendimento em cada horário disputado.
- Isolamento: conta externa não leu/alterou configuração; operador global não obteve acesso aos clientes do tenant.
- Despublicar/republicar funcionou. Plano de apresentação preservou página e bloqueou reserva/slots; restauração do recurso reativou reservas. Cancelamento suspendeu página, preservando exportação autorizada da configuração e reservas.
- Endpoint real rejeitou origem externa, corpo inválido e excesso de tentativas (429 com Retry-After). **Zero erros JavaScript e zero chamadas de envio de e-mail** nos percursos observados.
- Limpeza transacional por tenant/UUID/prefixo exclusivos removeu contas, planos e clínica temporários da execução. `cleanup: true`; demonstrações permanentes não foram usadas como fixtures.

Validação local anterior preservada: **71 testes aprovados**, build e QA Chromium/PGlite isolado em quatro larguras, conforme documento 14. Capturas online de página/editor/comprovante estão em `docs/qa-public-online/`; página em 390 px inspecionada visualmente.

## Limites preservados

Sem e-mails, pagamento online, cobrança automática, cancelamento público por link, verificação de identidade do visitante ou página permanente de demonstração habilitada automaticamente. Marcação pública não comprova pagamento. A demo `/demo` continua ilustrativa. Relatório não comprova proteção universal contra abuso distribuído nem auditoria editorial integral PT-PT. Avisos anteriores de bundle >500 KB e comentários Zod permanecem, sem falha de build. O modo Vercel production pertence exclusivamente ao projeto de testes.

Referências primárias consultadas para configuração técnica: [headers de requisição Vercel](https://vercel.com/docs/headers/request-headers) e [variáveis pela CLI](https://vercel.com/docs/cli/env). A confirmação do funcionamento acima decorre dos testes próprios, não da documentação.
