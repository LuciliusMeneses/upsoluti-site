# ADR-001: Arquitetura de Monólito Modular e Multi-Tenancy com RLS

- **Status:** Aprovado
- **Decisor:** Pedro Principal (Principal Software Engineer)
- **Data:** 2026-10-09

## Contexto
O sistema precisa atender a requisitos estritos de isolamento de dados entre organizações clientes (multi-tenant), oferecer alto desempenho para consultas analíticas e relacionais de vendas (Pipelines e Deals), e ser concebido como API-first para futura integração com ferramentas de agentes de IA e serviços externos.

## Decisão
1. **Padrão Arquitetural:** Monólito Modular. Toda a lógica de negócios residirá numa base de código unificada (Next.js / Node.js com TypeScript), organizada em domínios isolados (`contacts`, `deals`, `auth`, `integrations`), impedindo importações circulares e acoplamento direto de persistência fora de cada módulo.
2. **Estratégia Multi-Tenant:** Banco de dados compartilhado (*single database*) com **Row Level Security (RLS)** a nível de linha no PostgreSQL. Cada tabela deve possuir uma coluna obrigatória `organization_id` associada a políticas automáticas que restringem acessos ao contexto da sessão do usuário.
3. **Extensibilidade (Custom Fields):** Adopção de colunas relacionais fixas para campos canônicos somada a um campo `custom_fields` do tipo `JSONB` com índices GIN para campos arbitrários definidos pelo cliente.
4. **Camada de IA/Ferramentas:** Toda chamada de agente de IA deve obrigatoriamente transitar por adaptadores do tipo Tools/MCP autenticados que invocam serviços de domínio sob as regras de RBAC padrão, sem privilégios especiais no banco de dados.

## Consequências
- **Positivas:**
  - Complexidade operacional drasticamente menor comparada a microsserviços.
  - Baixa latência nas comunicações internas entre módulos.
  - Garantia de isolamento de dados a nível de kernel do banco de dados (PostgreSQL RLS).
- **Negativas / Mitigações:**
  - Requer testes automatizados rigorosos para garantir que nenhuma consulta contorne o contexto de tenant.
