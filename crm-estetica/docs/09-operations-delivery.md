# Núcleo operacional entregue no ambiente de testes

2026-11-04. Continuação autorizada pelo usuário. SaaS comercial multiempresa, uma base de código e três superfícies, conforme `SAAS-PRODUCT-DIRECTIVE.md`. Nenhuma alteração nos projetos Alvo ou Events.

## O que está disponível

- Serviços: cadastro/edição, categoria, preço em centavos inteiros, duração, preparação e ativação. Sem exclusão de histórico.
- Profissionais: unidade, serviços habilitados, ativação e vínculo opcional a membro autenticado. Limite de profissionais **ativos** aplicado no servidor, inclusive em pedidos concorrentes e reativações.
- Disponibilidade: intervalos semanais da unidade e do profissional; ambos são obrigatórios. Bloqueios por unidade ou profissional. Sem horários comerciais presumidos.
- Clientes: cadastro/edição/ativação, busca por nome, paginação de 50, preferência de contato e observações operacionais. Alerta por e-mail/telefone duplicado, com confirmação explícita para cadastro separado. Sem prontuário clínico ou envio de mensagens.
- Agenda interna: dia por profissional, lista e período de sete dias; filtros de unidade/profissional/serviço/estado. Criar, confirmar, reagendar e cancelar. Motivos nas mudanças, versão otimista, histórico com autor e horário. Cancelamento libera o horário e mantém o registro.
- Disponibilidade e gravação compartilham o motor PostgreSQL. Duração + preparação, horários, bloqueios e conflitos são revalidados sob trava transacional por estabelecimento. Chaves idempotentes de marcação vinculadas ao ator e ao conteúdo.
- Preço, moeda, duração, preparação e nomes são preservados na marcação; alterações posteriores de catálogo não reescrevem a contratação. Valor de serviço não representa pagamento.
- Exportação do proprietário em Configurações: fundação/assinatura/histórico + serviços, profissionais, clientes, horários, bloqueios, marcações e eventos. Continua autorizada após encerramento da assinatura.

## Isolamento e planos

Migração **006_operations.sql** revisada a partir do rascunho preservado em `docs/drafts/operations.sql`; integração adicional em `docs/drafts/operations-entitlements.sql`. Aplicada no Supabase exclusivo `lxzyybcvmlooiyvxmosp`. Histórico remoto 001–006 corresponde ao local.

Relações compostas por tenant, RLS e ausência de grants de escrita direta. Proprietário/gestor configuram catálogo, profissionais e disponibilidade; recepção também mantém clientes e agenda; profissional consulta somente sua agenda vinculada e clientes associados. Administrador da plataforma não ganha acesso operacional. Mutação exige assinatura gravável e funcionalidade contratada (`catalog`, `team`, `clients` ou `appointments`). Expiração/cancelamento mantêm leitura e exportação, sem exclusão automática.

Plano persistente **Teste — sem cobrança v2**, publicado e selecionado em **Estética Demonstração**. Adicionados catálogo/clientes/agenda aos recursos anteriores. Mantidos 0 BRL/mês, 1 unidade, 5 membros, 10 profissionais e fim exato da avaliação **2026-12-04T20:52:42.845426+00:00**. Versão 1 ocultada para novas contratações e mantida no histórico. Sem serviços, profissionais, clientes ou disponibilidade presumidos no estabelecimento permanente. Scripts de QA removem apenas seus próprios dados temporários.

## Validação efetiva

- TypeScript e build Vite aprovados. **38 testes locais** (24 anteriores + 14 operacionais), PostgreSQL PGlite: permissões, fronteiras empresariais, feature gate, quota, snapshots, versão, duplicados, idempotência, preparação/conflito, encerramento e datas de mudança de hora em Lisboa.
- QA PostgreSQL/Auth reais + Chromium local: run `31e3ccfa9d3442`, aprovado, limpeza confirmada.
- Mesmo percurso na Vercel: run `b3e729f936324d`, aprovado, limpeza confirmada. Criação pela UI de serviço/profissional/horário de unidade/cliente/marcação; recarga persistente; confirmação/reagendamento/cancelamento; isolamento por tenant/papel; duas reservas simultâneas permitem somente uma; quota concorrente de profissionais; exportação em modo de leitura.
- Regressão comercial na Vercel: run `a05a0c9e0dba44`, aprovada, limpeza confirmada. Planos versionados/publicados, onboarding mobile, cotas concorrentes de unidades/membros, assinatura manual/histórico, MRR separado de recebimento, exportação e acesso negado ao proprietário na plataforma.
- Quatro páginas operacionais em **320, 390, 768 e 1440 px**, formulário em 320 px e alternância PT-BR/PT-PT. Sem overflow global, erros JS ou chamadas de endpoints de envio de e-mail nos percursos. Seletores receberam rótulos acessíveis e largura responsiva após os primeiros ensaios.
- Verificação dedicada do plano/empresa permanentes pela UI Vercel aprovada após a limpeza. Evidências em `qa-operations/`, `qa-commercial/` e `qa-guided-demo/`. Nenhuma senha nos relatórios.

## Publicação verificada

Projeto Vercel **crm-estetica-test**, deployment **dpl_6GYAWPdEpYVBKjVuhb5UbbjmBYFU**, estado READY; alias https://crm-estetica-test.vercel.app. `/app` operação, `/platform` administração, `/` site, `/demo` prévia ilustrativa. Validação de upload: 23 arquivos web, excluídos envs, scripts, testes, dependências e arquivos locais protegidos. Sem commit/push. Target técnico production pertence somente ao projeto de testes; não é lançamento comercial.

## Limites desta versão

Agenda interna, sem marcação pública, recursos/cabines ou conclusão de atendimento. Pacotes, sessões, financeiro, comissões, comunicação, cobrança automática e suporte delegado continuam futuros. SMTP adiado por decisão do usuário. Marca Aura provisória.

Horários semanais usam o fuso empresarial. Bloqueios são informados explicitamente em UTC e exibidos no fuso empresarial. Slots têm offset e a hora repetida no retorno do horário de verão permanece distinguível; não se oferecem atendimentos que atravessem uma mudança de offset. Intervalos não cruzam a meia-noite. Editar/remover horários semanais existentes exige resolver antes todas as marcações futuras do estabelecimento: restrição conservadora desta versão.

Listas de configuração limitadas a 1.000, com aviso; calendário limita 1.000 marcações por consulta, com orientação de reduzir o período. Clientes paginam 50. Busca atual somente pelo nome. Exportação é JSON e não substitui estratégia de backup/restauração. Build preserva aviso de bundle compartilhado acima de 500 KB e comentários de dependência Zod; sem falha de compilação.

Para começar: **Serviços → Equipe (profissional + horários da unidade e do profissional) → Clientes → Agenda**. Não há vagas até configurar os dois tipos de horário.
