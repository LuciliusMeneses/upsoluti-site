-- ==============================================================================
-- MIGRATION 003: SEED DEVELOPMENT DATA (TENANTS, USERS, CONTACTS)
-- Para validação E2E com 2 tenants reais
-- ==============================================================================

-- 1. TENANTS (ORGANIZATIONS)
INSERT INTO organizations (id, name, slug, settings) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Organization A', 'org-a', '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'Organization B', 'org-b', '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. USERS (Simulação de claims JWT para middleware)
-- Nota: Em produção real, usuários são geridos pelo Supabase Auth.
-- Aqui inserimos apenas para contexto de RLS via app.current_organization_id
INSERT INTO users (id, organization_id, email, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'user-a@org-a.com', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'user-b@org-b.com', 'readonly')
ON CONFLICT (organization_id, email) DO NOTHING;

-- 3. CONTACTS INICIAIS (Seed para testes de isolamento)
INSERT INTO contacts (id, organization_id, first_name, last_name, email, phone, custom_fields) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'João', 'Silva', 'joao@empresa-a.com', '+351912345678', '{}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Maria', 'Santos', 'maria@empresa-b.com', '+351923456789', '{}'::jsonb)
ON CONFLICT DO NOTHING;