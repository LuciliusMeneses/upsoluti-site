import { NextRequest, NextResponse } from 'next/server';
import { createTenantClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Utilizadores de desenvolvimento (mock)
    // Em produção: usar Supabase Auth signInWithPassword
    const devUsers: Record<string, { id: string; orgId: string; role: string }> = {
      'user-a@org-a.com': { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', orgId: '11111111-1111-1111-1111-111111111111', role: 'owner' },
      'user-b@org-b.com': { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', orgId: '22222222-2222-2222-2222-222222222222', role: 'readonly' },
    };

    const user = devUsers[email];
    if (!user || password !== 'password') {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Criar token JWT mock (em produção: Supabase session)
    const mockToken = btoa(JSON.stringify({
      sub: user.id,
      email,
      app_metadata: { organization_id: user.orgId, role: user.role },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));

    return NextResponse.json({
      access_token: mockToken,
      user: { id: user.id, email, role: user.role, organization_id: user.orgId }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}