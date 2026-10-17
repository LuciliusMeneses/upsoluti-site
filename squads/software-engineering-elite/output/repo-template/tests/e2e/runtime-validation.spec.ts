import { test, expect } from '@playwright/test';

test.describe('CRM E2E - Vertical Slice Runtime Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Login flow - valid credentials redirect to dashboard', async ({ page }) => {
    // Em ambiente real, preencher formulário de login do Supabase/Auth
    await page.fill('[name="email"]', 'user-a@org-a.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Deveria redirecionar para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Create Contact via UI', async ({ page }) => {
    await page.goto('/contacts');

    // Verificar se está na página de contactos
    await expect(page.locator('h1')).toContainText('Contactos');

    // Clicar em novo contacto
    await page.click('button:has-text("Novo Contacto")');

    // Preencher formulário
    await page.fill('[name="firstName"]', 'Novo');
    await page.fill('[name="lastName"]', 'Contacto');
    await page.fill('[name="email"]', 'novo@teste.com');
    await page.fill('[name="phone"]', '+351999888777');
    await page.click('button[type="submit"]');

    // Verificar sucesso - contacto aparece na lista
    await expect(page.locator('table')).toContainText('Novo Contacto');
  });

  test('Read Contact - list displays contacts', async ({ page }) => {
    await page.goto('/contacts');
    await expect(page.locator('table')).toBeVisible();
  });

  test('Update Contact', async ({ page }) => {
    await page.goto('/contacts');

    // Clicar em editar no primeiro contacto
    await page.click('button:has-text("Editar"):first');

    await page.fill('[name="firstName"]', 'Atualizado');
    await page.click('button[type="submit"]');

    await expect(page.locator('table')).toContainText('Atualizado');
  });

  test('Delete Contact', async ({ page }) => {
    await page.goto('/contacts');

    const initialCount = await page.locator('tbody tr').count();

    // Clicar apagar no primeiro contacto
    await page.click('button:has-text("Apagar"):first');
    await page.click('button:has-text("Confirmar")');

    // Verificar redução
    await expect(page.locator('tbody tr')).toHaveCount(initialCount - 1);
  });

  test('RBAC - readonly user cannot create contact', async ({ page }) => {
    // Login como readonly user
    await page.goto('/login');
    await page.fill('[name="email"]', 'user-b@org-b.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto('/contacts');

    // Botão novo contacto não deveria estar visível ou ação bloqueada
    const newButton = page.locator('button:has-text("Novo Contacto")');
    await expect(newButton).toBeHidden(); // ou esperar erro 403 na API
  });

  test('Cross-tenant isolation - User B cannot see User A contacts', async ({ page }) => {
    // Login User A
    await page.goto('/login');
    await page.fill('[name="email"]', 'user-a@org-a.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto('/contacts');
    // Criar contacto único
    await page.click('button:has-text("Novo Contacto")');
    await page.fill('[name="email"]', 'unique-a@test.com');
    await page.click('button[type="submit"]');

    // Logout e Login User B
    await page.click('button:has-text("Logout")');
    await page.fill('[name="email"]', 'user-b@org-b.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto('/contacts');
    // User B NÃO deve ver o contacto do User A
    await expect(page.locator('table')).not.toContainText('unique-a@test.com');
  });

  test('Audit log - changes recorded', async ({ page }) => {
    // Este teste requer acesso direto ao banco ou API de auditoria
    // Validar que tabela audit_logs foi populada após operações acima
    const response = await page.request.get('/api/audit');
    expect(response.ok()).toBeTruthy();
    const logs = await response.json();
    expect(logs.length).toBeGreaterThan(0);
  });
});