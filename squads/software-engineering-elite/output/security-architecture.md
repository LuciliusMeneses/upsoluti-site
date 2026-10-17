# Arquitetura de Segurança e RBAC

**Responsável:** Sofia Segurança (Security Engineer)  
**Data:** 2026-10-09  
**Status:** Validado e Aprovado

---

## 1. Princípios de Segurança Aplicados

1. **Defesa em Profundidade (Defense-in-Depth):**
   - **Camada de Borda/Edge (Next.js Middleware):** Validação de tokens e sanitização de headers de segurança (`CSP`, `X-Frame-Options`, `nosniff`).
   - **Camada de Aplicação:** Verificação estrita de RBAC (`assertPermission`) antes de qualquer execução de caso de uso.
   - **Camada de Banco de Dados (PostgreSQL RLS):** Forçamento de Row-Level Security (`FORCE ROW LEVEL SECURITY`) impossibilitando vazamento de dados mesmo em caso de erro na camada aplicacional.

2. **Princípio do Menor Privilégio (PoLP):**
   - Nenhum serviço roda com permissões de `superuser` ou bypass de RLS em produção.
   - Agentes de IA/LLM operam exclusivamente com perfis de utilizador com credenciais delimitadas e RBAC.

3. **Matriz de Permissões RBAC:**
   - **`owner`**: Gestão integral de organização, membros, auditoria e recursos de CRM.
   - **`admin`**: Leitura, escrita e eliminação de contatos e negócios, consulta a logs de auditoria.
   - **`member`**: Leitura e escrita operacional (contatos e negócios).
   - **`readonly`**: Apenas visualização de dados do CRM.
