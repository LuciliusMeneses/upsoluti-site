# Alvo Higienização — Análise de Negócio (Discovery)

**Fonte:** `https://www.alvohigienizacao.pt` (acedido a 07/10/2026)

---

## 1. Identidade da Empresa
- **Nome:** Alvo Higienização
- **Localização:** Estrada de Men Martins, 274, Algueirão, Men Martins – Sintra
- **Área de Atuação:** Lisboa, Margem Sul e Sintra
- **Contacto Principal:** +351 93 411 1015 (Telefone/WhatsApp) | geral@alvohigienizacao.pt

---

## 2. Portfólio de Serviços & Preços Base

| Serviço | Descrição | Preço Base |
| :--- | :--- | :--- |
| **Higienização de Sofás** | Descontaminação, remoção de nódoas, odores, ácaros, bactérias. | A partir de **35€** |
| **Higienização de Colchões** | Mesmo processo aplicado a colchões. | A partir de **35€** |
| **Lavagem de Tapetes** | Limpeza profunda de tapetes. | *Sob consulta/orçamento* |
| **Lavagem de Estofos** | Estofos diversos (cadeiras, bancos auto, etc.). | *Sob consulta/orçamento* |
| **Impermeabilização de Tecidos** | Proteção preventiva contra líquidos e sujidade. | A partir de **120€** |

---

## 3. Proposta de Valor (Value Proposition)
1.  **Saúde:** Remoção de ácaros, bactérias e alergénios.
2.  **Estética/Longevidade:** Remoção de nódoas/odores e aumento da vida útil do estofado.
3.  **Segurança:** Produtos **biodegradáveis**, não tóxicos, seguros para famílias (crianças/animais) e ambiente.
4.  **Tecnologia:** Equipamentos modernos de extração/injeção (método profissional).

---

## 4. Segmentos de Cliente (Personas)
1.  **Residencial (B2C):** Proprietários/Inquilinos que valorizam saúde e higiene do lar.
2.  **Empresarial (B2B):** Hotéis, escritórios, clínicas, restaurantes, escolas, gestoras de condomínios. Necessidade de contratos recorrentes ou serviços pontuais de grande volume.

---

## 5. Fluxo Operacional Atual (As-Is)

```mermaid
graph TD
    A[Cliente Contacta<br/>(Tel/WhatsApp/Email)] --> B[Envio de Fotos<br/>(WhatsApp)]
    B --> C[Análise Manual<br/>& Orçamento]
    C --> D[Aprovação Cliente]
    D --> E[Agendamento Manual<br/>(Conforme Urgência)]
    E --> F[Execução Serviço<br/>(Equipa no Local)]
    F --> G[Pagamento/Recibo<br/>(Presencial/Transferência)]
```

**Pontos de Atrito Identificados:**
- **Dependência total de WhatsApp/Telefone:** Não há autonomia do cliente (self-service).
- **Orçamento Manual:** Tempo de resposta variável, propenso a erros de precificação.
- **Agendamento "Conforme Urgência":** Falta de visibilidade de slots reais, conflitos de agenda prováveis.
- **Gestão de Equipas/Stock:** Provavelmente em papel/Excel/Whatsapp (não visível no site, mas padrão do setor).
- **Pós-venda:** Não há menção a recalls, garantias, fidelização ou CRM.

---

## 6. Oportunidades de Digitalização (To-Be)

| Prioridade | Oportunidade | Impacto no Negócio | Complexidade Técnica |
| :--- | :--- | :--- | :--- |
| **P0 - Crítico** | **Portal de Orçamento & Agendamento Online (Self-Service)** | Reduz carga admin, capta leads 24/7, padroniza preços. | Média |
| **P1 - Alto** | **Gestão de Agenda/Equipas (Backoffice)** | Otimização rotas, aproveitamento equipas, visão real disponibilidade. | Média/Alta |
| **P1 - Alto** | **CRM Clientes & Histórico Serviços** | Recorrência (B2B), upsell (impermeabilização), marketing direcionado. | Baixa/Média |
| **P2 - Médio** | **Faturação/Recibos Automáticos (AT Certified)** | Conformidade, velocidade fecho caixa. | Média (Integração) |
| **P2 - Médio** | **Notificações Automáticas (WhatsApp/Email/SMS)** | Redução no-shows, confirmações, lembretes. | Baixa |
| **P3 - Futuro** | **App Técnico (Checklist, Fotos Antes/Depois, Assinatura Digital)** | Qualidade, prova de serviço, eficiência equipa. | Alta |

---

## 7. Requisitos Não-Funcionais Preliminares
- **Disponibilidade:** 99.5% (negócio local, tolera janelas de manutenção noturnas).
- **Performance:** Orçamento instantâneo (< 2s) para inputs padrão.
- **Segurança:** Dados pessoais (RGPD), pagamentos (PCI-DSS se gateway próprio).
- **Acessibilidade:** WCAG 2.1 AA (público geral idoso/diverso).
- **Mobile-First:** 80%+ tráfego esperado mobile (WhatsApp/Redes Sociais).

---

## 8. Próximos Passos (Action Items)

1.  [ ] **Product Manager:** Validar com *stakeholder* qual o **MVP** (P0 vs P1).
2.  [ ] **Architect:** Definir stack tecnológica (Monólito Modular sugerido para início).
3.  [ ] **Designer:** Mapear *User Journeys* detalhados para "Pedir Orçamento" e "Gerir Agenda".
4.  [ ] **Data Architect:** Esquema inicial de dados (Cliente, Serviço, Agendamento, Técnico, Fatura).

---

> **Nota do Orchestrator:** A informação acima serve de base para a **FASE 2 — Challenge** e **FASE 3 — Architecture**. Aguardamos a decisão do *Product Owner* sobre o escopo do MVP para prosseguir.