# Página individual e marcações por plano

Retomado em 2026-11-05 por escolha explícita do usuário. Validação local e limitações registradas em [14-public-page-local-validation.md](14-public-page-local-validation.md); sem publicação ou migração remota nesta retomada.

Escopo autorizado em 2026-11-04: recursos independentes `public_page` e `online_booking`, configuração do estabelecimento, URL `/clinica/<slug>`, publicação de catálogo/profissionais selecionados e reserva integrada ao motor existente. Sem alterar preços comerciais, enviar e-mails ou cobrar online.

Página pública só expõe campos publicados. A retirada do recurso ou encerramento da assinatura suspende a exposição, preservando configuração e histórico. Slug fica reservado ao estabelecimento e bloqueado após a primeira publicação. Logotipo raster pequeno incorporado, sem SVG/HTML remoto. Cadastros de reservas públicas não são mesclados por contato não verificado com clientes existentes.

Reservas passam por função de servidor Vercel, com chave de capacidade limitada a essa operação (sem service_role no runtime), origem validada, tamanho limitado e IP transformado em HMAC. O PostgreSQL valida chave, plano, publicação, serviço/profissional, antecedência, janela, limite de tentativas e conflito sob trava comum por tenant. Repetições usam chave idempotente. Resposta pública contém só comprovante opaco e os detalhes do atendimento, sem cadastros internos.

Critérios: isolamento, independência dos recursos de plano, suspensão/republicação sem perda, publicação explícita, conflito interno/público concorrente, retry, limites de pedidos, controles do endpoint e UI nas quatro larguras. Validar local/banco real/Vercel antes de declarar publicação concluída. Site comercial e administração mantidos separados da página da clínica.
