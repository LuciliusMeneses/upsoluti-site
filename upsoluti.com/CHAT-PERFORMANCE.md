# Desempenho do chat — 2026-10-26

O servidor solicita streaming ao router, recolhe os fragmentos e valida o JSON completo antes de responder ao navegador. Conteúdo parcial ou truncado não é mostrado nem persistido como resposta válida. Continua compatível com respostas JSON de routers que ignoram streaming.

`NINEROUTER_FAST_MODEL` é opcional e usa o mesmo endpoint/chave existentes. Quando definido e diferente de NINEROUTER_MODEL, tenta esse modelo por até8s; em falha ou resposta inválida, recorre ao combo/modelo original com limite45s. Cancelamento do cliente não inicia fallback. Nenhuma chave é enviada ao navegador.

Configuração proposta e testada: fast `gemini/gemini-3.5-flash-lite`; original `Atendente` permanece como fallback. Modelo rápido já listado por /v1/models do router. Não foi alterada a estratégia interna do combo (painel /api/combos retornou401).

Medições diretas com perguntas sintéticas e configuração local, sem criar conversas/leads: baseline sem streaming36,4s, prompt15352caracteres/5498tokens. Contexto otimizado10619caracteres (−30,8%); sem streaming36,8s/4429tokens. Streaming via combo variou de1,1s a35,7s; rota direta Flash Lite teve1,56s e0,96s em duas perguntas novas. Amostra pequena, sem controle de cache/carga/roteamento; não representa SLA nem latência de ponta a ponta do site.

Contexto inclui catálogo resumido dos seis serviços, detalhes completos de até três serviços relevantes e regras comerciais/privacidade sempre presentes. Respostas normais orientadas a2–4frases. Otimizações de armazenamento: leituras de idempotência em paralelo, criação sem escrita/leitura extra para opt-in ausente, captura sem consulta de lead quando faltam contactos e refresh apenas se estado muda. Não removem persistência, locks, idempotência ou entrega ao CRM.

Testes: chat-latency.test.cjs e chat-provider-stream.test.cjs cobrem operações remotas simuladas, seleção de contexto, fragmentação UTF-8, truncamento, falha do stream, limite de tamanho, compatibilidade JSON, fallback e cancelamento. Testes de captura existentes continuam a verificar consentimento, retry e estado pending/synced.
