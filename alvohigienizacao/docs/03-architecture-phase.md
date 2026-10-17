# Alvo Higienização — Fase 3: Arquitetura

**Decisão Estratégica:** Confirmada a **Opção B (WhatsApp-First + Backoffice Web)**.

---

## 1. Visão de Arquitetura (High-Level)

Será adotada uma abordagem de **Monólito Modular** utilizando **Next.js (App Router)**. A aplicação será dividida em contextos funcionais (Módulos) dentro da mesma base de código para facilitar a manutenção e garantir consistência, permitindo o *split* futuro para microserviços se necessário (YAGNI aplicado).

### Stack Tecnológica
- **Frontend/Backend:** Next.js (TypeScript) + Tailwind CSS (estilo moderno) + Shadcn/ui (componentes).
- **Base de Dados:** PostgreSQL (Supabase ou Neon) + Prisma ORM.
- **Autenticação:** Auth.js (v5) + NextAuth.
- **Integração:** WhatsApp Cloud API (Webhooks).
- **Infra:** Vercel (Frontend/Serverless Functions) + Supabase (Database/Realtime).

---

## 2. Modelo de Dados (Schema Inicial)

O Data Architect definiu o esquema relacional base para suportar o MVP.

```prisma
// Prisma Schema simplificado
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  role      Role     @default(CLIENT)
  name      String?
}

model ServiceType {
  id          String  @id @default(uuid())
  name        String  // Ex: "Higienização de Sofás"
  basePrice   Decimal
  durationMin Int
}

model Booking {
  id          String    @id @default(uuid())
  clientId    String
  serviceId   String
  status      Status    @default(PENDING) // PENDING, CONFIRMED, COMPLETED, CANCELLED
  scheduledAt DateTime
  address     String
  notes       String?
}

enum Role { CLIENT, ADMIN, TECHNICIAN }
enum Status { PENDING, CONFIRMED, COMPLETED, CANCELLED }
```

---

## 3. Fluxo de Integração (WhatsApp -> Sistema)

O Integration Architect definiu o fluxo crítico:

1.  **Cliente envia mensagem** (ex: "Quero limpar sofá").
2.  **WhatsApp Cloud API** recebe mensagem.
3.  **Webhook Next.js** (Serverless Function) recebe o evento.
4.  **Lógica de Negócio (Bot):**
    *   Verifica se utilizador existe.
    *   Se não, regista/solicita nome.
    *   Solicita serviço/fotos.
5.  **Sistema:**
    *   Regista `Booking` (status PENDING).
    *   Notifica Admin no Painel (via Supabase Realtime).

---

## 4. Próximos Passos (FASE 5 - Technical Design)

1.  **Frontend/UI:** Designer começa o *wireframing* do Painel de Controlo (Backoffice) para gestão dos agendamentos pendentes.
2.  **Backend/Integration:** Iniciar setup do endpoint de Webhook para WhatsApp API.
3.  **Database:** Criar migrações iniciais no PostgreSQL.

---

> **Nota do Orchestrator:** A fase de arquitetura está desenhada. Estamos prontos para iniciar o desenho técnico das APIs e o setup da infraestrutura no Supabase/Vercel.

**Próxima Ação:** Desenho técnico detalhado da integração WhatsApp e da interface do Backoffice.
