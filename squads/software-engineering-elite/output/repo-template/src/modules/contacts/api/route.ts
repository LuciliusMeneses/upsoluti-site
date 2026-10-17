import { NextRequest, NextResponse } from 'next/server';
import { createTenantClient } from '@/lib/db';
import { createContactSchema } from '../domain/schemas';
import { TenantContext } from '@/modules/auth/rbac';

// Utilitário para extrair contexto de tenant do token JWT
async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  const supabase = createTenantClient(token);
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) return null;

  // Em produção, obteríamos organization_id e role do user_metadata ou de uma tabela de users
  // Para este MVP, assumimos que o JWT contém as claims necessárias
  const orgId = user.app_metadata?.organization_id;
  const role = user.app_metadata?.role || 'member';

  if (!orgId) return null;

  return {
    userId: user.id,
    organizationId: orgId,
    role: role as TenantContext['role'],
    email: user.email || '',
  };
}

export async function GET(request: NextRequest) {
  const context = await getTenantContext(request);
  if (!context) {
    return NextResponse.json({ error: 'Não autenticado ou organização em falta' }, { status: 401 });
  }

  try {
    const { ContactService } = await import('@/modules/contacts/services/contact-service');
    const service = new ContactService(context, request.headers.get('authorization')?.replace('Bearer ', ''));

    const contacts = await service.list();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = await getTenantContext(request);
  if (!context) {
    return NextResponse.json({ error: 'Não autenticado ou organização em falta' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createContactSchema.parse(body);

    const { ContactService } = await import('@/modules/contacts/services/contact-service');
    const service = new ContactService(context, request.headers.get('authorization')?.replace('Bearer ', ''));

    const contact = await service.create(validated);
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}