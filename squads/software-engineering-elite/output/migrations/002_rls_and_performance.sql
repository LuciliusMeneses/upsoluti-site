-- ==============================================================================
-- MIGRATION 002: ROW LEVEL SECURITY POLICIES, INDEXES & TRIGGERS
-- Database Engineer: Dante Dados (db-dante-dados)
-- ==============================================================================

-- 1. FUNÇÃO AUXILIAR PARA RECUPERAÇÃO DO TENANT CONTEXT
-- Suporta tanto Supabase JWT Claims (app_metadata / user_metadata)
-- quanto transaction-scoped variables: set_config('app.current_organization_id', ..., true)
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
DECLARE
    org_id_text TEXT;
BEGIN
    -- 1º: Tenta obter da variável de sessão/transação da aplicação
    org_id_text := current_setting('app.current_organization_id', true);
    IF org_id_text IS NOT NULL AND org_id_text <> '' THEN
        RETURN org_id_text::UUID;
    END IF;

    -- 2º: Tenta obter das claims do Supabase JWT se auth.jwt() existir
    BEGIN
        IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
            org_id_text := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id');
            IF org_id_text IS NOT NULL THEN
                RETURN org_id_text::UUID;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE UPDATED_AT
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. FORÇAR ROW LEVEL SECURITY PARA TODOS OS USUÁRIOS (INCLUSIVE TABLE OWNERS QUANDO APLICÁVEL)
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE pipelines FORCE ROW LEVEL SECURITY;
ALTER TABLE deals FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE RLS POR TABELA

-- ORGANIZATIONS
DROP POLICY IF EXISTS tenant_isolation_organizations ON organizations;
CREATE POLICY tenant_isolation_organizations ON organizations
    FOR ALL
    USING (id = current_org_id())
    WITH CHECK (id = current_org_id());

-- USERS
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (organization_id = current_org_id())
    WITH CHECK (organization_id = current_org_id());

-- CONTACTS
DROP POLICY IF EXISTS tenant_isolation_contacts ON contacts;
CREATE POLICY tenant_isolation_contacts ON contacts
    FOR ALL
    USING (organization_id = current_org_id())
    WITH CHECK (organization_id = current_org_id());

-- PIPELINES
DROP POLICY IF EXISTS tenant_isolation_pipelines ON pipelines;
CREATE POLICY tenant_isolation_pipelines ON pipelines
    FOR ALL
    USING (organization_id = current_org_id())
    WITH CHECK (organization_id = current_org_id());

-- DEALS
DROP POLICY IF EXISTS tenant_isolation_deals ON deals;
CREATE POLICY tenant_isolation_deals ON deals
    FOR ALL
    USING (organization_id = current_org_id())
    WITH CHECK (organization_id = current_org_id());

-- AUDIT LOGS (Apenas Leitura e Inserção para auditoria)
DROP POLICY IF EXISTS tenant_isolation_audit_logs_select ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs_select ON audit_logs
    FOR SELECT
    USING (organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_isolation_audit_logs_insert ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs_insert ON audit_logs
    FOR INSERT
    WITH CHECK (organization_id = current_org_id());

-- 5. ÍNDICES DE PERFORMANCE E MULTI-TENANCY OTIMIZADA

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_org_created ON contacts (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_org_email ON contacts (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields_gin ON contacts USING GIN (custom_fields);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_org_pipeline ON deals (organization_id, pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_org_status ON deals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_org_created ON deals (organization_id, created_at DESC);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users (organization_id, role);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_entity ON audit_logs (organization_id, entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (organization_id, actor_id, created_at DESC);
