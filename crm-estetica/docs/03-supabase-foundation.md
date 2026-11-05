# Item 1 — Supabase exclusivo e fundação remota

2026-11-04. Escopo expresso do usuário: somente conectar Supabase e validar migrações, cadastro/login/recuperação, convites e isolamento. Não foram implementados agenda operacional, catálogo, clientes, sessões, financeiro ou demais fases.

## Infraestrutura

Após a autorização para pausar o Events, o próprio usuário realizou a pausa no painel. CLI confirmou `PAUSING` antes da criação. Nenhuma operação de pausa/delete foi executada pelo agente. Projeto novo **crm-estetica**, ref `lxzyybcvmlooiyvxmosp`, organização pessoal, `eu-west-1`, criação retornou `ACTIVE_HEALTHY`; sem upgrade pago solicitado. Não reutiliza tabelas/chaves dos demais projetos.

Projeto vinculado pela CLI. Aplicadas 001_foundation, 002_invitations e 003_strict_foundation_input, esta última impede valores JSON de tipos inesperados no onboarding. Cinco tabelas com RLS ativo, bucket `establishment-private` privado. As migrações continuam versionadas; histórico remoto 001/002/003 confirmado. Configuração remota de Auth declara somente os campos do item; demais valores, incluindo MFA, foram preservados. Diff final: zero mudanças pendentes declaradas, cinco propriedades apenas remotas preservadas.

Auth: senha mínima 12, confirmação de e-mail, alteração segura, rotação de refresh token, `site_url` local 3220 e redirects exatos para callback/reset nas origens 127.0.0.1 e localhost. Sem wildcard de domínio. `web/.env.local` usa chave pública; chave de serviço usada no QA somente na memória do processo servidor, nunca inserida no frontend, relatórios ou screenshots. Senha aleatória do banco cifrada com DPAPI em `.local/`, ignorada pelo Git; não incluída nesta documentação.

## Ajustes necessários no código

- Formulário de convites finalmente ligado ao botão: inspeção encontrou que a primeira entrega mantinha texto informativo na abertura do modal. Todos os membros podem aceitar um código; somente owner recebe formulário de criação. Banco continua impondo a autorização.
- Auth extraído para componente próprio. Confirmação da nova senha no cadastro/recuperação, campos bloqueados durante envio, feedback sem afirmar entrega de e-mail não comprovada. Callback/reset abre modo operacional, recuperação remove tokens da barra após sucesso.
- Inicialização de sessão evita uma resposta atrasada sobrescrever um evento de Auth mais recente. Logout limpa cache, seleção e modal. Branding demo fica separado da identidade operacional.
- QA da demonstração atualizado para reconhecer login configurado; originais visuais preservados.

## Verificação

Build/TypeScript e 8 testes locais aprovados após os ajustes. Há avisos não bloqueantes da dependência Zod e tamanho do bundle com o Supabase agora incluído; nenhum erro de compilação. Não representa certificação de desempenho.

QA remoto com SDK e JWT reais, mais Chromium headless contra Vite local. Resultado final em `docs/qa-foundation/supabase-results.json`, run `1f6bf54e273f41f2`, com 10 grupos de verificações:

1. Geração de link de cadastro no Auth real, rejeição de login antes da confirmação, confirmação do token e login com senha.
2. Isolamento na Data API das tabelas atuais, negação de escrita direta de vínculos/dados empresariais e de exclusão de auditoria; tipos JSON inesperados rejeitados.
3. Convites vinculados ao e-mail, uso único, receção sem privilégios administrativos, convite para owner proibido.
4. Usuário com vínculos explícitos em dois estabelecimentos e gestor sem permissão para convidar.
5. Profissional com permissões limitadas, duas aceitações simultâneas com apenas uma bem-sucedida, convite expirado rejeitado e vínculo revogado sem leitura.
6. Anônimo sem acesso e upload privado não implementado negado.
7. Login, criação de convite pelo formulário real e logout no navegador.
8. Callback real de recuperação, confirmação e troca efetiva de senha, senha antiga recusada e nova aceita. Tokens de callback não ficam na barra após concluir.
9. Configurações autenticadas em desktop/mobile sem erro JS ou overflow de página; capturas revisadas, movimento reduzido nas capturas finais.
10. Onboarding mobile persistindo empresa, primeira unidade, proprietário, moeda e fuso no banco remoto.

Após a execução, consulta agregada confirmou **zero empresas, zero vínculos e zero usuários sintéticos**, bucket privado. Nenhum cadastro operacional do usuário foi criado. A primeira execução do próprio QA teve caminho de dependência incorreto e deixou fixtures; cleanup restrito ao ID dessa execução removeu 2 empresas/3 contas antes de repetir. Segunda execução ampliada encontrou seletor de label de select não exato no onboarding; dados foram removidos, seletor corrigido e percurso integral aprovado. Não ocultar essas falhas como se fossem verificações aprovadas na primeira tentativa.

Regressão visual/demo: `node tests/browser-qa.cjs` passou em 320/390/768/1440, PT-PT e login configurado; `docs/qa/results.json`. Calendário tem rolagem interna intencional. Não há auditoria integral WCAG, teste de carga ou garantia regulatória.

## SMTP — pendência real

Usuário escolheu **outro SMTP já contratado**. Solicitados nome do provedor, remetente e caminho local de credenciais próprias deste projeto; dados ainda pendentes. Template sem segredos: `supabase/smtp.env.example`; cópia preenchida deve ficar em `.local/smtp.env`. Não ler/reutilizar credenciais de outros projetos sem indicação.

Os testes de Auth geram links pelo endpoint administrativo e verificam tokens reais **sem envio SMTP**. Isso comprova o fluxo e a troca de senha, mas **não comprova entrega de mensagens**, nem o cadastro público com transporte de e-mail. Não foi desativada a confirmação para contornar essa pendência. O item 1 continua parcialmente pendente até conectar o SMTP e validar a entrega no destinatário autorizado. Sem publicação da aplicação, commit/push ou avanço para item 2.
