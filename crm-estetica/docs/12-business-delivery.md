# Pacotes, financeiro, comissões e relatórios

2026-11-04. Implementação autorizada pelo usuário após o cadastro demonstrativo dos módulos operacionais. Aplicadas as skills locais de contexto/engenharia e o padrão do workspace, sem execução de squad/subagentes. Preservados os projetos Alvo/Events e os dados existentes do CRM Estética.

## Entrega

- **Pacotes e sessões:** catálogo de pacotes de um serviço, quantidade, preço, validade opcional, ativação e política configurável de exigir quitação. Venda cria contrato com snapshot e parcelas; renovação cria nova venda/saldo. Sessões são consumidas somente na conclusão. Saldo derivado de conclusões/reversões, com número de sessão exclusivo. Cancelamento/falta não descontam sessões. Expiração bloqueia novo consumo, sem apagar saldo/histórico. Cancelar um contrato exige reverter consumos e estornar recebimentos.
- **Conclusão pela agenda:** proprietário/gestor pode concluir após o término previsto, usando serviço avulso ou pacote compatível com cliente/serviço/validade. Revalidação no servidor. Conclusão avulsa gera cobrança; conclusão por pacote consome uma sessão sem criar segunda venda. Estado concluído bloqueia reagendamento/cancelamento até reversão. Reversão com motivo restaura a sessão e anula cobrança avulsa/comissão; pagamentos correspondentes precisam ser estornados antes.
- **Financeiro da clínica:** cobranças e parcelas mensais, vencimentos, pendências, recebimentos totais/parciais, método de pagamento, estornos parciais, despesas pagas e reversões. Todas as correções geram movimentos novos, preservando o original. Sem integração bancária ou emissão fiscal.
- **Comissões:** regra por profissional/serviço (nenhuma, percentual ou fixa), snapshot e demonstrativo. Evento escolhido: conclusão do atendimento. Percentual em pontos-base inteiros, arredondamento para o centavo mais próximo. Pacote distribui preço por sessão usando quociente + resto nos primeiros números de sessão; reversão libera o mesmo número, sem duplicar centavos. Não há comissão na venda do pacote. Pagamento manual integral do saldo e reversão auditada, separados dos recebimentos dos clientes.
- **Visão geral e relatórios:** período no fuso empresarial, marcações por estado, minutos não cancelados, vendas válidas, recebimentos líquidos, despesas líquidas, comissões pagas e movimento líquido de caixa. Saldos atuais a receber/vencidos/comissões pendentes, pacotes a vencer em 30 dias e clientes sem próxima marcação. Fórmulas/escopos visíveis, sem inventar ocupação, faltas, lucro contábil ou conversão monetária. Exportação JSON do relatório.
- **Exportação completa:** Configurações preserva o RPC existente e adiciona contratos, consumo, cobranças/parcelas, caixa, regras/comissões/liquidações e auditoria. Proprietário mantém acesso após encerramento da assinatura. Sem tokens, senhas ou dados de outras empresas.

## Banco e autorização

Migração **007_business.sql** aplicada no Supabase exclusivo `lxzyybcvmlooiyvxmosp`; histórico **001–007** local/remoto sincronizado. Tabelas com tenant, relações compostas, RLS e somente leitura direta autenticada. Mutações via `manage_business`, validação estrita de tipos/inteiros, identidade de `auth.uid()`, chave idempotente vinculada ao conteúdo/ator e trava transacional comum da empresa. Sem saldo negativo, excesso de recebimento/estorno ou dupla conclusão/comissão.

Nesta versão, proprietário e gestor operam todos os novos módulos. Recepção mantém as permissões anteriores de agenda/clientes, sem permissão financeira; consulta direta de modelos/contratos de pacote segue o escopo operacional existente. Profissional não consulta o financeiro global; administrador do SaaS não ganha acesso ao caixa da empresa. Direitos de `packages`, `finance`, `appointments` e `reports` verificados no servidor conforme operação. Assinatura encerrada preserva leitura/histórico/exportação e bloqueia escritas.

Os três fluxos permanecem separados: assinatura da plataforma; recebimento de clientes pela clínica; pagamento de comissão ao profissional. Registros manuais não executam transferências nem comprovam conciliação bancária.

## Validação observada

- TypeScript/build aprovados; **52 testes locais** (38 anteriores + 14 de negócio) em PostgreSQL PGlite: snapshots, parcelas/centavos, parcial/estorno, idempotência, esgotamento/reversão de sessões, expiração, regra de comissão, liquidação/reversão, relatórios, tenant/papéis, features e encerramento/exportação.
- QA PostgreSQL/Auth reais + Chromium local: **98659d452da94c**, aprovado e fixtures removidas.
- QA do mesmo fluxo na Vercel: **4a9371e77caf4c**, aprovado e fixtures removidas. Pacote/venda/comissão/conclusão/recebimento/despesa/reversões pela UI; pagamentos simultâneos não excedem parcela; conclusões simultâneas não excedem saldo de sessão; relatórios conferem com os movimentos.
- Regressão operacional na Vercel: **4008720976cb47**, aprovada e limpa. Regressão comercial: **45c665eb377448**, aprovada e limpa.
- Novas quatro páginas em **320, 390, 768 e 1440 px**, formulário mobile e PT-PT; nenhum overflow global, erro JS ou chamada de endpoint de e-mail nos percursos testados. Capturas/resultados em `qa-business/`. Revisão visual desktop/mobile realizada.
- Dados permanentes conferidos por `verify-guided-business.mjs`: três modelos/contratos, oito parcelas, três comissões, totais de relatórios/visão geral e persistência após recarga. Evidências em `qa-guided-demo/business-*.png` e `business-ui-results.json`.

## Publicação

**crm-estetica-test**, deployment **dpl_AAetwMa5jbWtz8JhYXzFEzQaLZt4**, READY, alias https://crm-estetica-test.vercel.app. Artefato revisado: **26 arquivos web**, sem envs, testes, scripts administrativos, dependências locais ou segredos. Sem commit/push. Target técnico production é somente o projeto isolado de testes, sem declaração de prontidão comercial.

Plano demonstrativo **Teste — sem cobrança v3**, com `packages`, `finance` e `reports`. Mantidos preço 0 BRL/mês, limites 1 unidade/5 membros/10 profissionais e fim da avaliação **2026-12-04T20:52:42.845426+00:00**. Revisões anteriores ocultas para novas contratações, preservadas no histórico.

## Exemplos permanentes

Autorização de popular módulos mantida. `seed-guided-business.mjs`, com manifesto local protegido e chaves idempotentes, criou três modelos e três vendas: Facial 5 sessões, Laser 6 sessões e Bem-estar 4 sessões, todos identificados como Teste. O Laser exemplifica a exigência de quitação. Criadas três conclusões demonstrativas, quatro regras, três comissões, oito parcelas e cinco movimentos de caixa. Uma comissão liquidada.

Somente três novos atendimentos históricos fictícios em 2026-11-04 foram inseridos pelo script administrativo local para demonstrar conclusão sem esperar o futuro; a aplicação comum não oferece essa inserção nem permite concluir antecipadamente. Agendamentos demonstrativos existentes de 05/06 de novembro foram preservados. Nenhum dado real de contato, informação clínica, e-mail ou transferência bancária. A chave administrativa existiu apenas no processo local, fora do frontend/artefato.

Posição demonstrativa: **R$ 1.850,00** em vendas válidas, **R$ 350,00** recebidos líquidos, **R$ 125,00** em despesas pagas, **R$ 12,00** em comissões pagas, **R$ 1.500,00** a receber e **R$ 25,00** em comissões pendentes. Esses valores são exemplos de teste, não receita comercial da plataforma. Não remover esses registros em limpezas de QA.

## Limites explícitos

Modelo de pacote com um serviço; sem combinação de serviços, reserva antecipada de saldo, transferência entre clientes, ajuste livre de sessões ou cancelamento parcial de contrato. Sem check-in/início clínico ou regras automáticas por falta. Conclusão operacional não é prontuário.

Financeiro manual: sem gateway, conciliação, integração fiscal, juros/descontos automáticos, despesas a prazo/contas a pagar, datas contábeis retroativas ou fechamento de caixa. Recepção/profissional não liquidam comissões. Não há comissão por pagamento recebido; a regra desta versão usa conclusão. Exportação JSON, sem CSV ou documentos fiscais. Listas de negócio limitadas a 1.000 registros com aviso, conforme padrão operacional atual; relatório máximo de 366 dias.

Marcação pública, comunicação, cobrança automática da assinatura, suporte delegado e indicadores completos do SaaS continuam futuros. Perfil sem e-mails preservado. Aviso anterior do bundle compartilhado acima de 500 KB e comentários de Zod permanece, sem falha de build.
