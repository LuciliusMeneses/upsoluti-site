# Cadastro manual de empresas — publicado em testes

2026-11-05. Usuário autorizou a publicação e, após bloqueio inicial da revisão automática, autorizou explicitamente guardar a credencial administrativa como Secret no servidor do projeto exclusivo **crm-estetica-test**. Nenhuma credencial foi impressa, incluída no frontend ou copiada para este relatório.

## Resultado

Em https://crm-estetica-test.vercel.app/platform, acessar **Empresas e assinaturas → Nova empresa**. O formulário cadastra empresa, primeira unidade, região e plano/versionamento. Permite **vincular uma conta existente** ou **criar nova conta do proprietário** com senha inicial e liberação administrativa. Não envia e-mails, não troca a senha de conta existente e não registra pagamento. O administrador global continua separado dos vínculos operacionais do estabelecimento.

Migrations **009_manual_companies.sql** e **010_manual_company_conflict.sql** aplicadas no Supabase exclusivo `lxzyybcvmlooiyvxmosp`; histórico **001–010 sincronizado** confirmado por CLI. Preparação persistente/idempotente, autorização, validação e conclusão transacional conforme documento 17. Secret administrativo configurado somente no runtime autorizado, sem prefixo VITE. Perfil sem e-mails e demais variáveis preservados.

Deploy final **dpl_AP6ZMgKCL6VooHb2wqYLAdqHNWtc**, **READY**, alias **https://crm-estetica-test.vercel.app**. Funções Node `api/booking` e `api/platform/company` confirmadas pelo inspect. Target técnico production do projeto de testes; não constitui lançamento comercial. Sem commit/push.

## Correções necessárias para a entrega

O primeiro QA online detectou que SQLSTATE `40001` usado num conflito determinístico do cadastro provocava repetição na camada PostgREST e resposta tardia/genérica. Diagnóstico próprio reproduziu o atraso; a [base oficial Supabase](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions) descreve o problema e orienta um código explícito de conflito.

Migration 010 preserva a 009 já aplicada e altera **somente** `platform_prepare_company` para `PT409`. O handler mapeia para HTTP409/request_reused e limita consultas SQL a 15 segundos. Diagnóstico real após a correção: resposta HTTP409/PT409 em 148ms na amostra. Solicitações sintéticas de diagnóstico removidas e consulta confirmou ausência de chamadas ativas desse RPC naquele momento. Não foi necessário reiniciar o projeto ou encerrar conexões de outras operações.

O segundo QA detectou uma resposta incompleta na disputa entre duas criações de conta: após erro de duplicidade no Auth, a consulta de retomada já podia devolver empresa concluída. O handler agora retorna essa empresa também nesse caminho, sem executar outra conclusão ou substituir a conta. Incluído teste de regressão. Relatórios das duas tentativas anteriores foram preservados, ambos com limpeza concluída, em `docs/qa-manual-online/results-first-conflict-failure.json` e `results-concurrent-response-failure.json`.

Essa correção é restrita ao cadastro manual. Outros RPCs legados que usam SQLSTATE40001 para conflitos de negócio não foram revisados nesta entrega; não assumir que a correção se estende automaticamente a eles.

## Validação final observada

- **89 testes aprovados**, nove arquivos; TypeScript/build locais e remotos aprovados. Avisos anteriores Zod/bundle >500KB permanecem sem falha.
- QA real online **7597ec99b8434a**, resultado em `docs/qa-manual-online/results.json`, **aprovado**. Chromium, Auth, PostgREST, PostgreSQL e função Vercel reais, sem interceptação de API.
- Formulário autenticado e listagem em **320/390/768/1440px**, sem overflow horizontal da página ou do diálogo. Modal permite rolagem interna. Captura do formulário em390px inspecionada visualmente; ação PT-PT verificada.
- Conta existente vinculada pela UI; senha original continuou válida. Uma unidade, um owner, assinatura em avaliação com snapshot/versionamento e zero vínculo operacional do operador.
- Nova conta criada pela UI, autenticação SDK validada e **login real pela aplicação mobile** até a agenda. Solicitação repetida retornou a mesma empresa; conteúdo alterado foi rejeitado. Anônimo, usuário de estabelecimento e origem externa recusados.
- **Duas requisições concorrentes reais** com a mesma solicitação criaram uma conta Auth e uma empresa, ambas retornando o mesmo tenant.
- Retomada de solicitação preparada com conta Auth já criada e marcada concluiu a empresa sem trocar usuário/senha. O teste representa interrupção entre Auth e transação empresarial, não atomicidade distribuída.
- Reload confirmou quatro empresas sintéticas e quatro eventos administrativos. **Zero erros JavaScript e zero chamadas de envio de e-mail** nos percursos observados.
- Limpeza transacional removeu as quatro empresas, plano e solicitações exclusivamente da execução, e o Auth administrativo removeu as contas sintéticas correspondentes. `cleanup: true`; contas, planos e demonstrações permanentes não foram alterados por esta execução.

## Verificação do artefato

`docs/qa-manual-online/artifact-audit.json`: manifesto final de **33 arquivos fonte** sem envs, `.local`, scripts administrativos/testes ou credenciais. Auditoria leu o HTML público e os **cinco arquivos JavaScript** alcançáveis pelo grafo de imports da aplicação publicada e confirmou ausência do valor da credencial administrativa. A credencial foi obtida apenas em memória para a comparação e não aparece no resultado.

## Limites mantidos

Auth e transação empresarial são serviços separados: contas pendentes podem exigir retomada/revisão quando a conclusão falha. Não há exclusão automática diante de resultado incerto. A chave de retomada permanece em memória do formulário; antes de reabrir um cadastro com resultado incerto, consultar a listagem. Rotação da credencial administrativa altera fingerprints de solicitações pendentes.

Sem troca obrigatória de senha no primeiro acesso, e-mail/SMTP, transferência de propriedade, alteração/exclusão de empresas, fila administrativa de solicitações pendentes ou cobrança automática. Nova conta tem acesso liberado administrativamente; isso não comprova verificação da caixa de e-mail. Cadastro público continua fechado. O limite de dez estabelecimentos por proprietário permanece como proteção de teste. A credencial administrativa tem privilégios amplos e sua presença no runtime do projeto de testes foi especificamente aprovada; essa autorização não se estende a outros projetos ou produção comercial.

As descrições “somente local” dos documentos 16/17 e memórias anteriores foram superadas por esta publicação, sem apagar o histórico.
