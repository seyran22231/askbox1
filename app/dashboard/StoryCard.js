'use client';

import { useEffect, useState } from 'react';

/**
 * Генерирует картинку 9:16 и передаёт её в системное меню «Поделиться»
 * (там есть TikTok). Если телефон не умеет делиться файлами — скачивание.
 * Открыть сразу редактор TikTok Stories с сайта нельзя гарантировать.
 */
export default function StoryCard({ id, version }) {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { setState('idle'); setFile(null); setUrl(''); setMsg(''); }, [version]);

  async function generate() {
    setState('loading');
    setMsg('');
    try {
      const res = await fetch(`/api/card/${id}?v=${encodeURIComponent(version || '')}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const f = new File([blob], `story-${id.slice(0, 8)}.png`, { type: 'image/png' });
      setFile(f);
      setUrl(URL.createObjectURL(blob));
      setState('ready');
      return f;
    } catch {
      setState('error');
      setMsg('Не удалось создать картинку. Попробуйте ещё раз.');
      return null;
    }
  }

  function download(f = file) {
    if (!f) return;
    const a = document.createElement('a');
    const href = URL.createObjectURL(f);
    a.href = href;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 5000);
  }

  // Вызывается сразу по нажатию, без ожидания сети: iPhone разрешает меню
  // «Поделиться» только в прямом ответ на нажатие пользователя.
  async function share() {
    const f = file;
    if (!f) return;
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try {
        await navigator.share({ files: [f] });
        setMsg('В меню выберите TikTok → «Сторис». Если TikTok в меню нет — сохраните картинку и добавьте её в сторис из галереи.');
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        download(f);
        setMsg('Картинка скачана. Откройте TikTok → «+» → «Сторис» и выберите её из галереи.');
      }
    } else {
      download(f);
      setMsg('Картинка скачана. Откройте TikTok → «+» → «Сторис» и выберите её из галереи.');
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {state === 'ready' && url && <img className="preview" src={url} alt="Карточка для сторис" />}
      <div className="row">
        {state === 'ready' ? (
          <>
            <button className="btn" onClick={share}>Поделиться в TikTok Story</button>
            <button className="btn secondary" onClick={() => download()}>Скачать</button>
          </>
        ) : (
          <button className="btn" onClick={generate} disabled={state === 'loading'}>
            {state === 'loading' ? 'Создаём картинку…' : 'Сделать карточку для сторис'}
          </button>
        )}
      </div>
      {msg && <div className={state === 'error' ? 'error' : 'muted small'} style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
