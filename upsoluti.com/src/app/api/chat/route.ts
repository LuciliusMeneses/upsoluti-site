import { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { CHAT_COOKIE, MAX_MESSAGE_LENGTH, type ChatConfig } from '@/lib/chat/types';
import { acquireConversation, createConversation, deleteConversation, findReply, getConversation, getStoredLead, releaseConversation, requestText, retentionDays, saveLead, saveReply, saveUserMessage, consumeRateLimit } from '@/lib/chat/store';
import { generateReply, providerConfig } from '@/lib/chat/provider';
import { deliverChatLead } from '@/lib/chat/handoff';
import { chatJson, readChatBody, sameOrigin } from '@/lib/chat/http';
import { parseLead } from '@/lib/contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;
const rateSalt = randomBytes(16).toString('hex');
function config(): ChatConfig {
  let bookingUrl: string | null = null;
  try { const url = new URL(process.env.NEXT_PUBLIC_BOOKING_URL || ''); if (url.protocol === 'https:' && !url.username && !url.password) bookingUrl = url.href; } catch { /* Optional booking is not configured. */ }
  return { aiAvailable: !!providerConfig(), bookingUrl, retentionDays: retentionDays() };
}

export async function GET(req: NextRequest) {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return chatJson({ error: 'Pedido não permitido.' }, 403);
  try { return chatJson({ config: config(), conversation: getConversation(req.cookies.get(CHAT_COOKIE)?.value) }); }
  catch { return chatJson({ error: 'Não foi possível carregar o atendimento.' }, 503); }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return chatJson({ error: 'Pedido não permitido.' }, 403);
  try {
    const session = getConversation(req.cookies.get(CHAT_COOKIE)?.value);
    if (session) deleteConversation(session.id);
    const response = chatJson({ ok: true });
    response.cookies.set(CHAT_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/chat', maxAge: 0 });
    return response;
  } catch { return chatJson({ error: 'Não foi possível apagar a conversa. Tente novamente.' }, 503); }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return chatJson({ error: 'Pedido não permitido.' }, 403);
  let body: Record<string, unknown>;
  try { body = await readChatBody(req); } catch { return chatJson({ error: 'Verifique o pedido e tente novamente.' }, 400); }
  const ip = rateSalt + ':' + (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local');
  try {
    if (body.action === 'start') {
      if (body.consent !== true) return chatJson({ error: 'Confirme o início da conversa.' }, 400);
      const existing = getConversation(req.cookies.get(CHAT_COOKIE)?.value);
      if (existing) return chatJson({ conversation: existing, config: config() });
      if (!consumeRateLimit('start:' + ip, 12, 3600000)) return chatJson({ error: 'Aguarde antes de iniciar outro atendimento.' }, 429);
      const created = createConversation();
      const response = chatJson({ conversation: created.conversation, config: config() });
      response.cookies.set(CHAT_COOKIE, created.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/chat', maxAge: retentionDays() * 86400 });
      return response;
    }
    const token = req.cookies.get(CHAT_COOKIE)?.value;
    const session = getConversation(token);
    if (!session) return chatJson({ error: 'A conversa terminou. Inicie um novo atendimento.' }, 401);
    if (!['send', 'lead'].includes(String(body.action))) return chatJson({ error: 'Pedido inválido.' }, 400);
    if (!consumeRateLimit('session:' + session.id, 24, 600000) || !consumeRateLimit('messages:' + ip, 80, 3600000)) return chatJson({ error: 'Recebemos vários pedidos. Aguarde alguns minutos.' }, 429);
    if (!acquireConversation(session.id)) return chatJson({ error: 'Aguarde a resposta anterior antes de continuar.' }, 409);
    try {
      if (body.action === 'send') {
        if (typeof body.message !== 'string' || body.message.trim().length < 2 || body.message.length > MAX_MESSAGE_LENGTH || typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) return chatJson({ error: 'Escreva uma mensagem entre 2 e 1500 caracteres.' }, 400);
        const previous = requestText(session.id, body.requestId);
        if (previous && previous !== body.message.trim()) return chatJson({ error: 'O pedido já foi utilizado com outra mensagem.' }, 409);
        const cached = findReply(session.id, body.requestId);
        if (cached) return chatJson({ reply: cached, conversation: getConversation(token) });
        if (!providerConfig()) return chatJson({ error: 'A conversa IA está indisponível neste momento. Pode deixar um pedido para contacto ou escrever para contacto@upsoluti.com.' }, 503);
        if (session.messages.length >= 80) return chatJson({ error: 'Este atendimento atingiu o limite de mensagens. Pode deixar o pedido para a equipa.' }, 429);
        saveUserMessage(session.id, body.requestId, body.message.trim());
        const messages = getConversation(token)!.messages;
        const reply = await generateReply(messages, req.signal);
        const profile = { ...session.profile, ...reply.contact, ...(reply.interest ? { interest: reply.interest } : {}) };
        saveReply(session.id, body.requestId, reply, profile);
        return chatJson({ reply, conversation: getConversation(token) });
      }
      if (body.consent !== true || !body.lead || typeof body.lead !== 'object' || Array.isArray(body.lead)) return chatJson({ error: 'Confirme os dados e autorize o envio do pedido.' }, 400);
      const raw = body.lead as Record<string, unknown>;
      if (raw.website) return chatJson({ error: 'Pedido inválido.' }, 400);
      const lead = parseLead({ ...raw, formKind: 'contact', website: '', source: typeof body.source === 'string' && body.source.startsWith('/') && !body.source.startsWith('//') ? body.source.slice(0, 300) : '/' });
      if (!lead || lead.company.length < 2 || typeof raw.timing !== 'string' || !['immediate', 'quarter', 'exploring'].includes(raw.timing)) return chatJson({ error: 'Verifique nome, e-mail, empresa, interesse e contexto do pedido.' }, 400);
      const stored = getStoredLead(session.id) || saveLead(session.id, { lead, timing: raw.timing, consentAt: new Date().toISOString(), transcript: session.messages.map(({ role, text, createdAt }) => ({ role, text, createdAt })) }, { name: lead.name, email: lead.email, phone: lead.phone, company: lead.company, interest: lead.goal });
      const status = await deliverChatLead(stored);
      return chatJson({ leadStatus: status, conversation: getConversation(token) });
    } finally { releaseConversation(session.id); }
  } catch (error) {
    const failure = error instanceof Error ? error : null;
    console.error('[chat] request failed', { type: failure?.name || 'UnknownError', code: failure?.message === 'provider_unavailable' || failure?.message === 'invalid_provider_reply' ? failure.message : undefined, cause: (failure?.cause as { code?: string } | undefined)?.code });
    return chatJson({ error: 'Não foi possível concluir o atendimento agora. Tente novamente ou fale connosco por e-mail.' }, 503);
  }
}
