# Salas, cabines e equipamentos — implementação local

2026-11-05. Usuário autorizou avançar com recursos físicos integrados às agendas. Plano em `19-resources-plan.md`. **Implementação e validação locais concluídas; sem migração remota ou publicação desta etapa.** Último histórico remoto verificado continua001–010/deploy do documento18. Dados e planos demonstrativos permanentes não foram acessados nem modificados nesta execução.

## Entrega

Nova seção **Recursos** na aplicação do assinante, com três áreas: Recursos, Por serviço e Bloqueios. Cadastro de sala/cabine/equipamento por unidade, ativo/inativo, nome e limpeza0–120min. Associações selecionam recursos específicos para cada serviço/unidade; **todos** são necessários simultaneamente. Não há alocação entre salas alternativas nesta versão.

Bloqueios ativos para manutenção/limpeza extra, informados em UTC e exibidos no fuso do estabelecimento. Criar/editar um bloqueio que sobreponha reserva é rejeitado. Desativação de bloqueio preserva registro/auditoria. Unidade de um recurso é imutável após criação; edição de nome/tipo/limpeza afeta novas reservas e preserva snapshots anteriores.

O recurso fica ocupado desde o início do atendimento até seu término mais **o maior intervalo entre a preparação do serviço e a limpeza do recurso**. Intervalos contíguos são permitidos: fim da reserva é exclusivo. Limpeza não pode atravessar fechamento, mudança de dia/offset ou bloqueio da unidade. Profissionais diferentes não podem ocupar o mesmo recurso no mesmo intervalo.

Agenda interna mostra recursos reservados nos cartões/detalhes e oferece filtro de recurso entre os presentes no período consultado. Detalhes mostram nome/limpeza preservados e fim da ocupação. Consulta de horários interna e pública usa o mesmo verificador; o visitante não recebe cadastro ou nomes de recursos. Reservas públicas continuam com o mesmo formato de comprovante, sem pagamento ou envio de mensagens.

## Persistência e autorização

Migration **011_physical_resources.sql**, local. Tabelas físicas/associações/bloqueios/alocações/eventos com tenant e relações compostas; RLS e somente leitura direta autenticada. Mutações via `manage_resource`, por proprietário/gestor com direito Agenda (`appointments`) e assinatura gravável. Recepção consulta, sem configurar; profissional consulta somente snapshots/alocações da própria agenda, sem acesso ao cadastro global de recursos. Operador do SaaS não ganha acesso operacional.

Sem novo preço, plano ou quota comercial inventados: a capacidade física integra o recurso Agenda já existente. Remover um recurso do plano não ignora reservas/restrições existentes; leitura autorizada/exportação continuam. Escritas novas verificam plano no servidor. Recursos sem associação não afetam a disponibilidade dos serviços.

`manage_resource` valida tipos/campos, tenant/unidade/serviço/IDs ativos, idempotência por ator/tenant/chave/conteúdo e versões explícitas PT409. Associações têm até100 recursos específicos. Bloqueios têm duração máxima366dias e exigem instantes com offset. Tabelas não têm grants de escrita para usuários. Mudanças geram `resource_events` com estado anterior/entrada e auditoria do estabelecimento.

`private.resource_slot_error` compartilha regras entre `available_appointment_slots` e `public_clinic_slots`. Triggers de marcação revalidam recursos sob a trava transacional comum da empresa, criam snapshot imutável e mantêm `appointment_resources` em transação. Cancelamento libera disponibilidade por estado da marcação e mantém linhas históricas; reagendamento move as alocações com recursos/limpeza preservados. Escritas de gestão usam a mesma trava da agenda. Concorrência real entre conexões remotas ainda precisa de QA próprio após autorização.

O núcleo interno de `mutate_appointment`, movido para schema privado na007, foi mantido com a mesma lógica e recebeu somente PT409 para versão obsoleta, evitando o comportamento PostgREST constatado na etapa anterior. Recibos idempotentes continuam consultados antes da validação de versão. Demais RPCs legados não foram alterados globalmente.

## Compatibilidade e mudanças de configuração

Marcações existentes recebem snapshot vazio; **não há backfill, redistribuição ou alteração automática de marcações anteriores**. Alterar os recursos associados a um serviço/unidade exige tratar antes suas marcações vigentes/futuras. Associação inalterada pode ser salva sem invalidar reservas. Um recurso com ocupação vigente/futura não pode ser desativado. Se um recurso obrigatório sem reservas futuras for desativado, o serviço fica sem vagas até a configuração ser regularizada; o recurso não é ignorado silenciosamente.

O reagendamento preserva o conjunto de recursos originalmente reservado, inclusive conjunto vazio do legado. Atualizar configuração não reescreve preços, duração, nomes ou intervalos contratados. Exportação existente mantém nome/escopo e acrescenta cadastro, associações, bloqueios, alocações e eventos de recursos. Proprietário mantém exportação após cancelamento da assinatura.

## Validação observada

- `npm.cmd test`: **104 testes aprovados**, dez arquivos. Quinze testes de recursos, além dos89 anteriores. Suítes de operação, negócio e página pública foram atualizadas para executar migrations001–011, validando regressões contra o novo schema/triggers, e não somente contra seus schemas antigos.
- Casos SQL em PGlite: múltiplos recursos/limpeza máxima, dois profissionais disputando um recurso, consulta/reserva pública nos dois sentidos, cancelamento/reagendamento/snapshots, bloqueios de manutenção/unidade, limite de dia/limpeza, inativação, mudança de requisitos com reservas futuras, legado, tenant/unidade, papéis/profissional, escrita direta negada, versão/retry e exportação após encerramento.
- TypeScript/build aprovados. Avisos anteriores de comentários Zod e bundle compartilhado>500KB permanecem, sem falha.
- `npm.cmd run qa:resources:local`: Chromium, build real, handler Node real de reserva pública e PostgreSQL PGlite em memória com001–011. Auth e transporte PostgREST **simulados**; nenhuma conexão remota ou leitura de credenciais reais.
- UI criou cabine/equipamento, associou serviço e gravou manutenção. Três áreas e seus três formulários em **320/390/768/1440px**, sem overflow horizontal de página/diálogo. Capturas em `docs/qa-resources-local/`; tela390px e formulário de associação320px inspecionados visualmente. Modais usam rolagem interna quando necessária.
- UI fez marcação interna, exibiu snapshots/filtro, e visitante com segundo profissional viu horários ocupados/limpeza/manutenção indisponíveis; reserva pública no primeiro limite livre funcionou pelo handler real. Reagendamento e cancelamento pela UI preservaram histórico; exportação conteve quatro alocações para duas marcações e dois recursos.
- Assinatura encerrada manteve consulta/exportação e desabilitou criação. Ação **Guardar recursos** PT-PT e idioma do documento verificados. **Zero erros JavaScript e chamadas externas inesperadas**; fontes externas bloqueadas no QA. Não equivale a auditoria editorial completa PT-PT.
- Fixtures ficaram apenas no banco local descartável e foram encerradas ao final. Nenhum dado demonstrativo remoto foi usado como fixture.

## Próximo checkpoint

Após autorização específica: confirmar que011 é a única migração pendente, aplicar no Supabase exclusivo de testes, publicar apenas os arquivos pertinentes no projeto `crm-estetica-test` e validar Auth/PostgREST/PostgreSQL/Vercel reais. Nenhum novo segredo é necessário para este módulo.

QA remoto deve incluir duas conexões disputando recurso com profissionais diferentes, disputa interna/pública, concorrência com manutenção/reconfiguração, snapshots/reagendamento/cancelamento, papéis/tenant/assinatura/exportação, legado e quatro larguras. Limpeza somente de fixtures criadas para a execução, incluindo alocações/ledger/eventos antes dos recursos e tenants. Não habilitar ou associar recursos automaticamente na demonstração permanente.

Limites: recurso exclusivo, uma unidade, recursos obrigatórios específicos e intervalos fixos; sem pools/alternativas/capacidade coletiva, troca manual de recurso por atendimento, backfill de histórico, calendário próprio do recurso ou arrasto. Listas até1001 linhas com aviso acima de1000; filtro da agenda contém recursos das marcações do período. Sem publicação, commit/push, pagamentos, comunicação ou prontidão comercial nesta entrega.
