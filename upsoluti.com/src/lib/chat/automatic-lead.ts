import { parseLead } from '../contact';
import type { ChatConversation } from './types';
import { getStoredLead, saveLead } from './storage';
import { deliverChatLead } from './handoff';

/** Uses the existing confirmed-lead envelope and one lead per conversation. */
export async function captureConversationLead(session: ChatConversation, authorized: boolean, source: unknown) {
  if (!authorized) return;
  if (session.leadStatus === 'synced') return 'synced' as const;
  const lead = parseLead({
    name: session.profile.name || '',
    email: session.profile.email || '',
    phone: session.profile.phone || '',
    company: session.profile.company || '',
    goal: session.profile.interest || 'consultoria',
    message: session.messages.filter(message => message.role === 'user').map(message => message.text).join('\n\n').slice(0, 4000),
    formKind: 'contact',
    source: typeof source === 'string' && source.startsWith('/') && !source.startsWith('//') ? source.slice(0, 300) : '/',
  });
  if (!lead && !session.leadStatus) return;
  const existing = await getStoredLead(session.id);
  if (existing) return deliverChatLead(existing);
  if (!lead) return;
  const stored = await saveLead(session.id, {
    lead,
    timing: 'exploring',
    consentAt: new Date().toISOString(),
    transcript: session.messages.map(({ role, text, createdAt }) => ({ role, text, createdAt })),
  }, session.profile);
  return deliverChatLead(stored);
}
