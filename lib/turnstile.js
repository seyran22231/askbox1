// Необязательная капча Cloudflare Turnstile (бесплатная).
// Включается, если заданы NEXT_PUBLIC_TURNSTILE_SITE_KEY и TURNSTILE_SECRET_KEY.

export function captchaEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyCaptcha(token, ip) {
  if (!captchaEnabled()) return true;
  if (!token || typeof token !== 'string') return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
