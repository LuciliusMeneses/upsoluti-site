# Alvo Higienização — Fase 2: Challenge (Desafio de Premissas)

**Participantes:** Product Manager, Principal Architect, Principal Designer, Orchestrator.

---

## Premissas Identificadas na Discovery

| # | Premissa | Origem |
| :--- | :--- | :--- |
| 1 | O cliente **quer/precisa** de agendamento online self-service. | Padrão mercado / Descoberta |
| 2 | Orçamento instantâneo é tecnicamente viável para todos os serviços. | Análise de serviços (preços base fixos) |
| 3 | A equipa técnica tem capacidade/disciplina para usar uma app mobile no terreno. | Hipótese operacional |
| 4 | Faturação certificada (AT) é necessária no MVP. | Conformidade legal PT |
| 5 | A empresa gere stock de produtos/consumíveis que precisa de controlo. | Padrão setor |

---

## Desafio Crítico (Devil's Advocate)

### **PM Challenge:** "O agendamento self-service é mesmo a maior dor?"
- **Evidência contrária:** O site direciona tudo para WhatsApp. Clientes *já* usam WhatsApp. Forçar um portal web pode *aumentar* atrito se a UX mobile for má.
- **Alternativa mais simples (YAGNI):** **Bot WhatsApp Business API** estruturado (menu interativo: "1. Sofá 2. Colchão 3. Tapete" -> Foto -> Preço automático -> Slot agenda -> Confirmação).
- **Trade-off:** Portal Web = autonomia total / SEO / Marca. Bot WhatsApp = encontra cliente onde ele *já está*, custo dev menor, adoção imediata.
- **Decisão Pendente:** Validar com dono: "Onde chegam mais leads? Site ou WhatsApp?"

### **Architect Challenge:** "Monólito Modular vs Serverless vs BaaS (Firebase/Supabase)"
- **Requisitos Reais:** CRUD Agendamentos, Clientes, Serviços, Notificações, Auth (Cliente + Admin + Técnico).
- **Overengineering Risco:** Kubernetes, Microserviços, Event Sourcing, Kafka.
- **Recomendação Strong:** **Next.js (App Router) + PostgreSQL (Supabase/Neon/Railway) + Prisma ORM**.
  - *Porquê:* TypeScript end-to-end, Auth nativo, DB gerido, Real-time (subscriptions para agenda), Deploy Vercel (zero ops), Escalável para milhões sem reescrita.
  - *Custo:* ~$0-25/mês início. *Time-to-market:* Semanas, não meses.

### **Designer Challenge:** "App Nativa para Técnicos (P3) vs PWA / Web Responsive"
- **Realidade:** Técnicos usam telemóveis pessoais (BYOD). Instalar APK/IPA = fricção, updates, storage.
- **Recomendação:** **PWA (Progressive Web App)** instalável via browser. Funciona offline (Service Workers para checklists/fotos), update instantâneo, zero store approval.
- **Requisito:** Camera API, File System Access API (suportado nos browsers móveis modernos).

### **Data Architect Challenge:** "Precisamos de multi-tenancy desde dia 1?"
- **Realidade:** 1 empresa (Alvo Higienização). Franchising ou SaaS para *outras* empresas de limpeza é **hipotético**.
- **Decisão:** **Single Tenant**. `company_id` hardcoded ou config. Adicionar multi-tenancy depois se o negócio pivotar para plataforma B2B2C. **YAGNI.**

---

## Decisões de Arquitetura Preliminares (Output do Challenge)

| Tópico | Decisão | Justificativa |
| :--- | :--- | :--- |
| **Arquitetura** | **Modular Monolith** (Next.js) | Simplicidade operacional, deploy atómico, refactoring fácil para services depois se necessário. |
| **Base de Dados** | **PostgreSQL** (Gerido: Supabase/Neon) | Relacional forte (transações, integridade, relatórios), JSONB para flexibilidade, Row Level Security (RLS) nativo para multi-role auth. |
| **Auth** | **NextAuth.js (Auth.js) v5** + Credentials / Magic Link / Google | Suporte nativo Server Components, adaptadores Prisma, MFA, roles. |
| **Estado/Real-time** | **Supabase Realtime / TRPC Subscriptions** | Agenda partilhada Admin/Técnico atualiza instantaneamente sem polling. |
| **Integração WhatsApp** | **WhatsApp Cloud API (Meta)** ou **Twilio** | Oficial, escalável, templates aprovados, Webhooks para respostas. |
| **Faturação PT** | **API Moloni / InvoiceXpress / SaftPt** | Integração via REST, webhook de status. Adiar para P1 se MVP for só agendamento. |
| **Hosting** | **Vercel** (Frontend + Edge Functions) + **Supabase/Neon** (DB) | Zero DevOps, Preview Deployments, Analytics, Global CDN. |
| **Monitoring** | **Vercel Analytics + Sentry (Errors) + Supabase Logs** | Suficiente para arranque. OpenTelemetry depois se complexidade crescer. |

---

## Riscos Atualizados Pós-Challenge

1.  **Adoção WhatsApp vs Web:** Se 90% leads vêm WhatsApp, portal web tem baixo ROI inicial. **Mitigação:** MVP = Bot WhatsApp + Painel Admin Web.
2.  **Complexidade Orçamento:** "A partir de 35€" esconde variáveis (tamanho, tecido, sujidade, acesso). **Mitigação:** Motor de regras de preço configurável (Admin define regras: `base + m2 + dificuldade + deslocação`).
3.  **Gestão de Chaves/Equipas:** Quem abre a porta? Chaves? Portaria? **Mitigação:** Campo "Instruções de Acesso" obrigatório no agendamento + Checklist Técnico (Chegou/Entrou/Iniciou/Finalizou/Saiu).

---

## Próxima Decisão (Input Necessário do Stakeholder)

> **QUAL O MVP ESCOLHIDO?**
>
> **Opção A (Portal Web Completo):** Cliente agenda no site -> Painel Admin -> (Futuro App Técnico). *Foco: Marca, SEO, Autonomia Total.*
>
> **Opção B (WhatsApp-First + Admin Web):** Bot WhatsApp inteligente para orçamento/agendamento -> Painel Admin Web robusto para gestão. *Foco: Velocidade, Adoção Imediata, Onde o Cliente Está.*
>
> **Opção C (Híbrido Leve):** Landing Page simples com "Pedir Orçamento" -> Abre WhatsApp pré-preenchido -> Admin gere tudo no Backoffice Web. *Foco: Mínimo Viável Absoluto.*

**Recomendação da Equipa:** **Opção B** (WhatsApp-First + Admin Web) — Melhor relação Valor/Esforço/Risco para negócio local de serviços.