import { NextRequest, NextResponse } from 'next/server';

export function chatJson(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } }); }
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : req.nextUrl.origin;
  return origin === req.nextUrl.origin || origin === expected;
}
export async function readChatBody(req: NextRequest): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.includes('application/json') || !req.body) throw new Error('invalid_body');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; bytes += next.value.byteLength; if (bytes > 18000) { await reader.cancel(); throw new Error('invalid_body'); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  const body = JSON.parse(new TextDecoder().decode(buffer));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_body');
  return body;
}
