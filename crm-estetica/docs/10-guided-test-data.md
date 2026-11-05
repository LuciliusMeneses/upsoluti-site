# Dados fictícios para teste dos módulos

2026-11-04. Usuário solicitou cadastro de informações de teste em cada módulo. Dados persistentes cadastrados por RPCs com a conta proprietária, sem chave de serviço e sem alteração de código publicado.

Em **Estética Demonstração / Unidade de Testes**:

- 4 serviços: limpeza de pele, depilação a laser, massagem relaxante e design de sobrancelhas; nomes identificados como Teste, preços fictícios em BRL, duração e preparação.
- 3 profissionais fictícios com serviços habilitados, sem novas contas de autenticação.
- 8 clientes fictícios, identificados como Cliente Teste; e-mails reservados `example.test`, sem telefones reais ou informações clínicas.
- 56 intervalos semanais: unidade e três profissionais, todos os dias, 09–12h e 13–18h, no fuso America/Sao_Paulo. Configuração exclusivamente demonstrativa.
- 1 bloqueio de treinamento: 2026-11-05, 14–15h, profissional Beatriz.
- 8 marcações: 5 em 2026-11-05 e 3 em 2026-11-06. Estados finais: 3 confirmadas, 3 agendadas e 2 canceladas, com histórico e motivos fictícios. Disponibilidade obtida e revalidada no servidor.

Scripts: `web/scripts/seed-guided-operations.mjs` e `verify-seeded-operations.mjs`. Manifesto local ignorado guarda chaves idempotentes e entradas das marcações; cadastros existentes são reutilizados sem sobrescrever edições. Preservar estes registros solicitados pelo usuário, não são fixtures descartáveis.

Verificação Chromium na Vercel aprovada: contagens reais em Serviços/Equipe/Clientes, bloqueio e horários, cinco marcações na primeira data, persistência após recarga e zero erros JS. Capturas em `qa-guided-demo/seeded-*.png`, resumo em `seed-results.json`. Dados refletem no deploy existente `dpl_6GYAWPdEpYVBKjVuhb5UbbjmBYFU`, sem novo deploy necessário.

Nenhum e-mail enviado, pagamento/comissão criado ou condição do plano alterada. Site, plano, assinatura e configurações já possuíam os dados de demonstração anteriores. Pacotes, financeiro, relatórios e demais módulos futuros continuam sem backend e não receberam registros ficticiamente apresentados como funcionais.
