import { readConsent } from './consent';
export function track(event: string, properties: Record<string,string> = {}) {
 // A local event hook; no personal data, cookies or external tracking by default.
 if(typeof window!=='undefined' && readConsent()?.analytics)window.dispatchEvent(new CustomEvent('upsoluti:analytics',{detail:{event,properties}}));
}
