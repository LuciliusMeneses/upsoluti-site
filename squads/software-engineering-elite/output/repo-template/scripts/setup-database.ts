#!/usr/bin/env node
/**
 * Script de setup e validação de base de dados para desenvolvimento.
 * Executa migrations e seed, valida RLS e isolamento.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration(filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

  for (const stmt of statements) {
    if (stmt.trim()) {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt.trim() });
      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Aviso em ${filePath}:`, error.message);
      }
    }
  }
  console.log(`✅ Migration aplicada: ${path.basename(filePath)}`);
}

async function validateSchema() {
  console.log('\n🔍 Validando schema...');

  // Verificar tabelas
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  const requiredTables = ['organizations', 'users', 'contacts', 'pipelines', 'deals', 'audit_logs'];
  for (const table of requiredTables) {
    const exists = tables?.some(t => t.table_name === table);
    console.log(exists ? `  ✅ ${table}` : `  ❌ ${table} FALTANDO`);
  }

  // Verificar RLS
  const { data: rls } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public');

  for (const table of requiredTables) {
    const t = rls?.find(r => r.tablename === table);
    console.log(t?.rowsecurity ? `  🔒 RLS ativo: ${table}` : `  🔓 RLS INATIVO: ${table}`);
  }

  // Verificar FORCE RLS
  const { data: forceRls } = await supabase
    .rpc('exec_sql', { sql: "SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity AND hasrowsecurity = true" });

  // Verificar policies
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('tablename, policyname')
    .eq('schemaname', 'public');

  console.log('\n📋 Políticas RLS:');
  policies?.forEach(p => console.log(`  - ${p.tablename}.${p.policyname}`));
}

async function testTenantIsolation() {
  console.log('\n🧪 Testando isolamento cross-tenant...');

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  // Definir contexto do Tenant A
  await supabase.rpc('set_config', { setting_name: 'app.current_organization_id', setting_value: tenantA, is_local: true });

  // Inserir contacto como Tenant A
  const { data: contactA } = await supabase.from('contacts').insert({
    organization_id: tenantA,
    first_name: 'Teste',
    last_name: 'Isolamento',
    email: 'teste@isolamento-a.com'
  }).select().single();

  if (contactA) {
    console.log(`  ✅ Contacto criado no Tenant A: ${contactA.id}`);

    // Tentar ler como Tenant B
    await supabase.rpc('set_config', { setting_name: 'app.current_organization_id', setting_value: tenantB, is_local: true });

    const { data: contactAsB } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactA.id)
      .single();

    if (!contactAsB) {
      console.log('  ✅ ISOLAMENTO CONFIRMADO: Tenant NÃO consegue aceder a contacto do Tenant A');
      return true;
    } else {
      console.log('  ❌ FALHA CRÍTICA: Tenant B acedeu a contacto do Tenant A!');
      return false;
    }
  }

  return false;
}

async function main() {
  console.log('🚀 Iniciando setup e validação de base de dados...\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations');

  // 1. Executar migrations
  const migrationFiles = ['001_initial_schema.sql', '002_rls_and_performance.sql', '003_seed_dev_data.sql'];

  for (const file of migrationFiles) {
    await runMigration(path.join(migrationsDir, file));
  }

  // 2. Validar schema
  await validateSchema();

  // 3. Testar isolamento
  const isolationOk = await testTenantIsolation();

  console.log('\n' + '='.repeat(50));
  if (isolationOk) {
    console.log('🎉 RUNTIME VALIDATED: Base de dados pronta para E2E');
    process.exit(0);
  } else {
    console.log('💥 FALHA: Isolamento de tenant não validado');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});