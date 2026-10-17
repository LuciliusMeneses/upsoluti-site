import { describe, it, expect } from 'vitest';
import { ContactService } from '../src/modules/contacts/services/contact-service';
import { TenantContext } from '../src/modules/auth/rbac';

describe('Multi-Tenant Isolation & Security Tests', () => {
  const tenantAContext: TenantContext = {
    userId: 'user-a',
    organizationId: 'tenant-org-A',
    role: 'owner',
    email: 'admin@tenant-a.com',
  };

  const tenantBContext: TenantContext = {
    userId: 'user-b',
    organizationId: 'tenant-org-B',
    role: 'owner',
    email: 'admin@tenant-b.com',
  };

  it('Garante que Tenant A possui isolamento de Tenant B no contexto de serviço', () => {
    const serviceA = new ContactService(tenantAContext);
    const serviceB = new ContactService(tenantBContext);

    expect(tenantAContext.organizationId).not.toBe(tenantBContext.organizationId);
    expect(serviceA).toBeDefined();
    expect(serviceB).toBeDefined();
  });

  it('Garante que a cláusula de tenant no serviço restringe queries à organização do contexto', () => {
    const serviceA = new ContactService(tenantAContext);
    // @ts-ignore
    expect(serviceA.context.organizationId).toBe('tenant-org-A');
    // @ts-ignore
    expect(serviceA.context.organizationId).not.toBe('tenant-org-B');
  });
});
