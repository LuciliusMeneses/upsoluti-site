import type { StoredLead } from './store';
import { markLeadSynced } from './storage';

export async function deliverChatLead(lead: StoredLead) {
  if (lead.status === 'synced') return 'synced' as const;
  const destination = process.env.CHAT_LEAD_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;
  if (!destination) return 'pending' as const;
  try {
    const url = new URL(destination);
    if (url.username || url.password || (url.protocol !== 'https:' && !(process.env.WEBHOOK_ALLOW_LOCAL_HTTP === 'true' && ['localhost', '127.0.0.1'].includes(url.hostname)))) return 'pending' as const;
    const token = process.env.CHAT_LEAD_WEBHOOK_TOKEN || process.env.CONTACT_WEBHOOK_TOKEN;
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': lead.id, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ event: 'public_chat.lead', id: lead.id, ...lead.payload }), redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return 'pending' as const;
    await markLeadSynced(lead.id);
    return 'synced' as const;
  } catch { return 'pending' as const; }
}
