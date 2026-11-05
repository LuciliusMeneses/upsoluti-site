# Plano e estabelecimento preparados para o usuário

2026-11-04. Usuário solicitou que o agente criasse/publicasse um plano e entrasse no estabelecimento para selecioná-lo. Execução feita com as próprias contas sintéticas autenticadas e RPCs autorizadas, sem chave de serviço, cobrança ou envio de e-mails.

- Plano persistente de demonstração: **Teste — sem cobrança**, código `teste-guiado-sem-cobranca`, versão1, publicado. Valor0BRL mensal, avaliação30dias, carência0, limite1unidade/5membros e10profissionais como configuração do módulo futuro. Recursos atuais: configurações e equipa/convites. Condições fictícias para testes, não preços comerciais definitivos.
- Estabelecimento persistente: **Estética Demonstração**, primeira unidade **Unidade de Testes**, PT-BR/Brasil/BRL/America/Sao_Paulo. Vínculo de proprietário na conta de teste de estabelecimento já fornecida ao usuário.
- Assinatura vinculada ao plano, estado `trialing` (avaliação), gravação habilitada, término **2026-12-04**. Plano e assinatura confirmados por consultas autenticadas e pela UI real Vercel em `/platform` e `/app`.
- Scripts locais: `web/scripts/setup-guided-demo.mjs` e `verify-guided-demo.mjs`. A criação guarda uma chave idempotente local e reutiliza plano/estabelecimento demonstrativo para evitar duplicação. Primeira tentativa precisou normalizar o BOM UTF-8 de `.env.local` antes de interpretar os campos; nenhuma gravação remota foi feita nessa tentativa.
- Capturas sem senhas em `docs/qa-guided-demo/`. Verificação Chromium: plano publicado, plano selecionado nas configurações do estabelecimento, avaliação ativa, sem erros JS.

Esses registros foram criados para uso continuado do usuário e **não são fixtures transitórias de QA**. Não removê-los nos scripts de limpeza. Credenciais permanecem nos arquivos locais protegidos existentes; nenhuma senha copiada para a documentação. Não houve alteração de código publicado ou novo deploy: dados do banco já refletem na Vercel.
