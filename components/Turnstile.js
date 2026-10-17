'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Капча Cloudflare Turnstile. Если ключ не задан — ничего не рендерит. */
export default function Turnstile({ onToken, resetKey }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || !ref.current) return;
      if (widgetId.current !== null) window.turnstile.remove(widgetId.current);
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(''),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector('script[data-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.turnstile = '1';
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }
    return () => { cancelled = true; };
  }, [onToken, resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={ref} style={{ marginTop: 12 }} />;
}

export const captchaRequired = Boolean(SITE_KEY);
