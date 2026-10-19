# Conhecimento e memória do chat UPsoluti

## Fontes oficiais

`src/lib/services.ts` contém as ofertas publicadas, descrições e FAQs. `src/lib/chat/service-contexts.ts` acrescenta diagnóstico, aplicações, métricas, limites e serviços relacionados para os seis serviços. `knowledge/services/` contém a exportação legível desses contextos; gerar novamente com `node scripts/export-chat-knowledge.cjs` após alterações.

O provider seleciona até três contextos por correspondência com as perguntas recentes. Respostas recebem as fontes oficiais e contexto da própria conversa; não há consulta automática à internet, a todas as tabelas do CRM ou aos dados de outros clientes.

## Memória de atendimento

- Histórico persistente com token aleatório em cookie HTTP-only; SQLite no desenvolvimento e armazenamento remoto no CRM quando `CHAT_STORE_URL` está configurado.
- Memória entre conversas é opcional e desativada por padrão. Não associar pessoas por nome, telefone ou email.
- Nova conversa cria um atendimento separado. Com autorização, até 12 excertos de mensagens do próprio visitante (até 400 caracteres cada) são usados para continuidade. São removidos emails/números e descartadas mensagens que pareçam conter segredos; isso não deve ser descrito como anonimização garantida.
- Sem autorização, uma nova conversa não recebe perfil de contato nem excertos anteriores. Mensagens mais antigas da conversa atual podem ser recuperadas para manter a coerência daquele atendimento.
- O contexto é enviado como dados do usuário, separado das instruções oficiais, e não pode alterar regras ou fatos da empresa.
- A retenção do grupo não é renovada ao abrir nova conversa. Expiração mantém o prazo do primeiro atendimento do grupo.
- Apagar remove as sessões/memórias associadas do próprio grupo e navegador. Pedidos já enviados ao CRM têm ciclo separado e são informados na interface.
- Desativar impede a reutilização e limpa os excertos ativos; apagar histórico é o controle para remover as conversas armazenadas.
- A versão remota usa a coluna JSON `profile` já existente. Não exige migração nova. Publicar primeiro a atualização de `crm-app/src/app/api/webhooks/upsoluti/chat-store/route.ts`, depois o site.

## Aprendizado compartilhado com revisão

O sistema não treina automaticamente pesos do modelo e não transforma conversas privadas em conhecimento público. Para melhorar respostas para todos:

1. A equipe identifica uma pergunta recorrente ou uma lacuna durante atendimento autorizado.
2. Redige uma FAQ geral sem dados pessoais, nomes, transcrições ou detalhes que identifiquem clientes.
3. Um responsável confirma a resposta e a compatibilidade com a oferta real.
4. Atualiza a fonte oficial (`services.ts`) ou o contexto de serviço, revisa e versiona a alteração.
5. Executa os testes, exporta os contextos e publica. Somente então a resposta entra na base utilizada para todos.

Não incorporar automaticamente alegações de visitantes, prompts, preços ou resultados como fatos oficiais. Sugestões da IA devem passar pela mesma revisão.

## Aplicação comercial

Relacionar marketing com páginas de conversão e acompanhamento; SEO com conteúdo e estrutura web; automação com integrações e exceções; IA com fontes e supervisão; software com fluxos, dados e permissões. As relações são sugestões de diagnóstico, não pacotes obrigatórios ou promessas de resultado.
