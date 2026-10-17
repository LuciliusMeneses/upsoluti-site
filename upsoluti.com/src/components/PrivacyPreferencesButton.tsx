'use client';
import { SlidersHorizontal } from 'lucide-react';
export default function PrivacyPreferencesButton() { return <button className="policies-preferences" type="button" onClick={() => window.dispatchEvent(new Event('upsoluti:privacy-open'))}><SlidersHorizontal size={16} aria-hidden="true" />Gerir preferências de privacidade</button>; }
