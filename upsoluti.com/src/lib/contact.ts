import { budgets, goals } from './lead-options';

export const validGoals: readonly string[] = goals.map(([key]) => key);
export type Lead = {
  name: string; email: string; company: string; goal: string; message: string;
  phone: string; companyWebsite: string; budget: string; formKind: string;
  website: string; source: string; utm_source: string; utm_medium: string;
  utm_campaign: string; origin: string;
};

export function parseLead(body: unknown): Lead | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;
  const result: Record<string, string> = {};
  const limits: Record<keyof Lead, number> = {
    name: 100, email: 254, company: 150, goal: 40, message: 4000,
    phone: 40, companyWebsite: 500, budget: 40, formKind: 20,
    website: 200, source: 300, utm_source: 100, utm_medium: 100, utm_campaign: 150, origin: 100,
  };
  for (const [key, max] of Object.entries(limits)) {
    if (data[key] !== undefined && typeof data[key] !== 'string') return null;
    const value = ((data[key] as string) || '').trim();
    if (value.length > max) return null;
    result[key] = value;
  }
  if (result.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) || /[\r\n]/.test(result.email) || result.message.length < 10 || !validGoals.includes(result.goal)) return null;
  if (result.phone && !/^[+0-9() .-]{7,40}$/.test(result.phone)) return null;
  if (result.formKind && !['contact', 'proposal'].includes(result.formKind)) return null;
  if (result.budget && !budgets.some(([key]) => key === result.budget)) return null;
  if (result.formKind === 'proposal' && (result.company.length < 2 || !result.budget)) return null;
  if (result.companyWebsite) {
    try {
      const url = new URL(/^https?:\/\//i.test(result.companyWebsite) ? result.companyWebsite : 'https://' + result.companyWebsite);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password || /\s/.test(result.companyWebsite)) return null;
      result.companyWebsite = url.href;
    } catch { return null; }
  }
  return result as Lead;
}
