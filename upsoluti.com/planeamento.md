# Planeamento Website UPsoluti

## 1. Arquitetura de Informação e Sitemap
A estrutura de navegação será guiada pela combinação de **Áreas de Serviço** e **Objetivos de Negócio** para maximizar a conversão.

- **Início**: Hero com proposta de valor, 4 pilares, problemas que resolvemos, simulação inicial, casos de sucesso e agendamento.
- **Serviços**:
    - **Marketing Digital**: Estratégia, Ads (Google/Meta), SEO, leads, Email Mkt, Analytics.
    - **Web & Software**: Websites/Landing pages, E-commerce, Apps, CRM, UI/UX, Integrações.
    - **Automação**: Processos, Marketing, Comercial, n8n, Integrações.
    - **Inteligência Artificial**: Consultoria, Agentes de IA, Assistentes virtuais, Automação de operações.
- **Sobre**: Sobre a UPsoluti, Metodologia, Projetos/Casos de Estudo.
- **Recursos**: Blog, FAQ, Simulador de Orçamento, Diagnóstico Digital.
- **Contactos**: Formulários e agendamento.

## 2. Arquitetura Técnica
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend/DB**: PostgreSQL/Supabase.
- **Automação**: n8n (reutilizando/integrando com CRM existente).
- **IA**: Backend seguro (Node.js/Python), RAG na base de conhecimento.
- **Qualidade**: Zod (validação), Vitest/Playwright (testes).

## 3. Backlog e Fases (Confirmado)
1. **Fundação**: Setup, Design System, Homepage.
2. **Conteúdos**: Páginas estruturais, CMS, SEO técnico.
3. **Conversão**: Simulador, Integração com CRM existente, Analytics.
4. **IA**: Assistente comercial e base de conhecimento.
5. **Automação**: Workflows CRM e integrações (alinhamento com CRM atual).
6. **Qualidade**: Auditoria final e deploy.

## 4. Notas de Implementação
- **CRM**: Utilizar a infraestrutura de CRM já existente, configurando as novas entradas do site.
- **Automação**: Focar na integração robusta entre as novas ferramentas de IA e os fluxos já existentes no CRM.
- **Conteúdo**: Todo conteúdo será em pt-PT.
