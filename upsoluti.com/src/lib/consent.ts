export const CONSENT_KEY = 'upsoluti_privacy_v1';
export type Consent = { version: 1; analytics: boolean; savedAt: number };
export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try { const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); return c?.version === 1 && typeof c.analytics === 'boolean' && typeof c.savedAt === 'number' && c.savedAt <= Date.now() && Date.now() - c.savedAt < 180 * 86400000 ? c : null; } catch { return null; }
}
