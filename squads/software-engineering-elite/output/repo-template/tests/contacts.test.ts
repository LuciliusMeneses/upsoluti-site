import { describe, it, expect } from 'vitest';
import { ContactService } from '../src/modules/contacts/services/contact-service';
import { TenantContext, AuthorizationError } from '../src/modules/auth/rbac';

describe('ContactService & RBAC Unit Tests', () => {
  const mockTenantContext: TenantContext = {
    userId: 'user-123',
    organizationId: 'org-456',
    role: 'member',
    email: 'test@example.com',
  };

  const mockReadonlyContext: TenantContext = {
    userId: 'user-999',
    organizationId: 'org-456',
    role: 'readonly',
    email: 'readonly@example.com',
  };

  it('deve permitir inicializar serviço com utilizador autenticado', () => {
    const service = new ContactService(mockTenantContext);
    expect(service).toBeDefined();
  });

  it('deve lançar AuthorizationError se utilizador readonly tentar escrever', async () => {
    const service = new ContactService(mockReadonlyContext);
    await expect(service.create({ firstName: 'Teste' })).rejects.toThrowError(AuthorizationError);
  });

  it('deve lançar AuthorizationError se utilizador readonly tentar apagar', async () => {
    const service = new ContactService(mockReadonlyContext);
    await expect(service.delete('any-id')).rejects.toThrowError(AuthorizationError);
  });
});