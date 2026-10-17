import { NextResponse } from 'next/server';

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

/** IP клиента (Vercel кладёт его в x-forwarded-for / x-real-ip). Используется только в виде хеша. */
export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Защита от CSRF: изменяющие запросы принимаются только с нашего же сайта. */
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req, maxBytes = 16_000) {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}
