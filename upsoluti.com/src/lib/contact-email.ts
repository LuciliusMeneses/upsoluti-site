import { createTransport } from 'nodemailer';
import type { Lead } from './contact';

// This cache reduces retry duplicates within one instance. SMTP does not provide
// durable idempotency; Message-ID alone cannot guarantee deduplication.
const delivered = new Map<string, number>();
const pending = new Map<string, Promise<'sent'>>();
const mailbox = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;

export async function notifyContact(lead: Lead, eventId: string): Promise<'sent' | 'disabled'> {
  if (process.env.CONTACT_EMAIL_ENABLED !== 'true') return 'disabled';
  const user = process.env.CONTACT_SMTP_USER?.trim() || '';
  const pass = process.env.CONTACT_SMTP_PASSWORD || '';
  const to = process.env.CONTACT_NOTIFICATION_TO?.trim() || '';
  if (!mailbox.test(user) || !mailbox.test(to) || !pass) throw new Error('SMTP configuration missing');
  if (!/^[a-f0-9-]{36}$/i.test(eventId)) throw new Error('Invalid notification identifier');
  const now = Date.now();
  for (const [id, until] of delivered) if (until <= now) delivered.delete(id);
  if (delivered.has(eventId)) return 'sent';
  const active = pending.get(eventId);
  if (active) return active;
  if (pending.size >= 100) throw new Error('Notification capacity reached');

  const send = async (): Promise<'sent'> => {
    const transport = createTransport({
      host: 'smtp.titan.email', port: 465, secure: true,
      auth: { user, pass },
      connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
      logger: false, debug: false,
    });
    try {
      const info = await transport.sendMail({
        from: { name: 'UPsoluti — Website', address: user },
        to,
        replyTo: { name: lead.name, address: lead.email },
        messageId: `<contact-${eventId}@${user.split('@')[1]}>`,
        subject: lead.formKind === 'proposal' ? 'Website UPsoluti: novo pedido de proposta' : 'Website UPsoluti: novo contacto',
        text: [
          'Novo pedido recebido pelo website e aceite pelo CRM.',
          '', `Nome: ${lead.name}`, `E-mail: ${lead.email}`,
          `Telefone: ${lead.phone || 'Não informado'}`,
          `Empresa: ${lead.company || 'Não informada'}`,
          `Website: ${lead.companyWebsite || 'Não informado'}`,
          `Objetivo: ${lead.goal}`, `Orçamento: ${lead.budget || 'Não informado'}`,
          '', 'Mensagem:', lead.message, '',
          `Origem: ${lead.source || 'Website'}`, `Referência: ${eventId}`,
        ].join('\n'),
        disableFileAccess: true, disableUrlAccess: true,
      });
      if (!info.accepted?.length || info.rejected?.length) throw new Error('SMTP did not accept recipient');
      if (delivered.size >= 10000) delivered.delete(delivered.keys().next().value!);
      delivered.set(eventId, Date.now() + 24 * 60 * 60 * 1000);
      return 'sent';
    } finally { transport.close(); }
  };
  const result = send();
  pending.set(eventId, result);
  try { return await result; } finally { pending.delete(eventId); }
}
