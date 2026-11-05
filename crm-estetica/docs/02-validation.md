# Fundação local — 2026-11-04

## Implementado

React/TypeScript/Vite, Tailwind compilado, TanStack Query para acesso remoto, RHF/Zod no onboarding. Layout próprio derivado de screen.png/code.html/DESIGN.md, verde-petróleo, painéis claros, Inter (Google Fonts com fallback local Arial), navegação recolhível, agenda por profissional, dia/semana/lista ilustrativos, filtro por estado e pesquisa demonstrativa, seleção de atendimento e painel lateral responsivo. Sem fotografias/dados reais ou informações clínicas da referência.

PT-BR/PT-PT em dicionário tipado, preferência local, atributo lang e formatação Intl. Não há conversão monetária nem mudança implícita de moeda/fuso por trocar idioma. Nome do estabelecimento remoto substitui a marca provisória na navegação. Idiomas de terceiros/erros são normalizados na interface Auth; a maioria das expressões compartilhadas não exige variante.

Supabase Auth integrado: cadastro, confirmação por e-mail, login, recuperação, troca no evento PASSWORD_RECOVERY e logout. Leitura remota de vínculos/unidades com estados de erro/carregamento. Onboarding salva empresa, primeira unidade, proprietário e auditoria por função SQL atômica. Seleção entre vínculos. Convites por código privado: função restrita ao owner, 48 horas, hash SHA-256, confirmação de e-mail correspondente, consumo único com lock, sem alterar papéis existentes nem enviar e-mail. UI de aceitar antes do onboarding e em configurações. Não há gestão posterior de papéis/bloqueio.

## Validação executada

- `npm run build`: TypeScript e build Vite aprovados. Rollup informa duas anotações de comentário ignoradas da dependência Zod, sem falha de build.
- `npm test`: **2 arquivos / 8 testes aprovados**. O teste de banco executa as duas migrações em **PGlite (PostgreSQL local WebAssembly)**, com Auth/Storage sintéticos. Verifica criação, lista isolada por empresa, negação de escrita direta/alteração de vínculos/auditoria, campos extras, convite de owner proibido, usuário com e-mail errado, terceiro sem autorização, aceite com papel correto, consumo repetido negado e acesso anon negado. Não é teste contra Supabase hospedado nem prova de concorrência da futura agenda.
- `node tests/browser-qa.cjs`: Chromium headless real, 320/390/768/1440 px; navegação PT-PT, pesquisa sem resultados, lista, seleção de atendimento, dialog informativo e retorno, login bloqueado sem configuração; sem erros JS ou overflow na página. Calendário tem rolagem horizontal interna intencional. Capturas agenda/auth/details em `docs/qa/`, resultados JSON preservados.
- Inspeção visual de agenda desktop/mobile e detalhes desktop/mobile realizada. Ajustada altura dos cartões curtos para preservar metadados. Não realizada auditoria completa WCAG ou teste de leitor de tela.

## Limites e checkpoint

Fundação implementada e validada localmente. Fase 1 ainda depende de integração e aceitação em Supabase dedicado: Auth/e-mails/redirects, aplicação remota de migrações/RLS/Storage e uso real dos convites. Sem configuração remota, a UI informa integração indisponível e não finge login/persistência.

Fases 2–6 ainda não implementadas; telas de módulos futuros mostram estado explícito. Agenda é demonstração, não motor de disponibilidade; nenhum atendimento concluído, pagamento recebido, sessão consumida ou mensagem enviada. Ausência de fornecedor de comunicação tem feedback explícito. Dados demo exclusivamente em memória. Sem deploy, commit/push, alteração de outros projetos ou cópia de segredos/dados da Alvo.

Servidor de desenvolvimento na porta 3220 usado no QA. Consulte README para execução e configuração. Próximo checkpoint: conectar uma instância Supabase exclusiva e validar os percursos Auth/onboarding/convites antes de declarar a Fase 1 operacional e avançar para agenda persistente.
