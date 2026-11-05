# Pacotes, financeiro e relatórios — implementação

Escopo autorizado em 2026-11-04: substituir as áreas pendentes por módulos persistentes, integrar conclusão de atendimento à agenda e preparar exemplos fictícios no estabelecimento de demonstração. Perfil sem e-mails, Supabase/Vercel exclusivos de testes e dados existentes preservados.

Modelo: pacotes de um serviço com sessões/validade/preço e política explícita de exigir quitação; vendas preservam condições. Consumo somente na conclusão, sem descontos por falta/cancelamento. Reversão com motivo restaura sessão. Cobranças/parcelas e movimentos de recebimento/estorno distintos de despesas pagas e liquidação de comissão. Comissão configurável por profissional (nenhuma, percentual ou fixa), calculada na conclusão, com snapshot; pacotes distribuem preço por sessão com resto de centavos determinístico. Assinatura SaaS fica fora de todos esses totais.

Critérios: direitos do plano e papéis no servidor; isolamento por tenant; idempotência e trava transacional; sem saldo negativo, pagamento excedente ou dupla comissão; histórico preservado e reversões explícitas. Relatórios por período no fuso empresarial, sem somar previsão a caixa. Testar PostgreSQL local/real, concorrência, exportação e UI em quatro larguras antes de publicar no projeto de testes já autorizado.
