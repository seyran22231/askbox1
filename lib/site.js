import { headers } from 'next/headers';

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Askbox';

/** Публичный адрес сайта: из NEXT_PUBLIC_SITE_URL или из заголовков запроса. */
export async function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
