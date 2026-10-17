'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { callApi, saveToken, secretLink } from '@/components/client-api';
import CopyButton from '@/components/CopyButton';
import Turnstile, { captchaRequired } from '@/components/Turnstile';

const MAX = 500;

export default function AskForm({ username }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [stored, setStored] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const onToken = useCallback((t) => setCaptcha(t), []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const data = await callApi('/api/questions', { username, question: text, captcha });
      setStored(saveToken(data.token, username));
      setLink(secretLink(data.token));
    } catch (e2) {
      setErr(e2.message);
      setCaptchaReset((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  async function shareLink() {
    try {
      await navigator.share({ title: 'Мой анонимный вопрос', text: 'Ссылка на ответ (никому не показывать):', url: link });
    } catch { /* пользователь закрыл меню */ }
  }

  function askAnother() {
    setText('');
    setLink('');
    setCaptcha('');
    setCaptchaReset((n) => n + 1);
  }

  if (link) {
    return (
      <main>
        <h1>Вопрос отправлен ✓</h1>
        <div className="card">
          <p><b>Это ваша секретная ссылка на ответ.</b> Только по ней можно прочитать ответ @{username}.
            Никому её не показывайте.</p>
          <div className="secret">{link}</div>
          <div className="row">
            <CopyButton text={link} label="Скопировать ссылку" className="btn" />
            {typeof navigator !== 'undefined' && navigator.share && (
              <button className="btn secondary" onClick={shareLink}>Сохранить в заметки…</button>
            )}
          </div>
          <div className="warn" style={{ marginTop: 14 }}>
            {stored
              ? <>Ссылка также сохранена в этом браузере — ответ появится в разделе <Link href="/my">Мои вопросы</Link>.
                  Но если вы очистите браузер или смените телефон, без сохранённой ссылки ответ не открыть.</>
              : <>Браузер не дал сохранить ссылку. Обязательно скопируйте её — восстановить её нельзя.</>}
          </div>
        </div>
        <button className="btn secondary block" onClick={askAnother}>Задать ещё вопрос</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Задай анонимный вопрос <span style={{ color: 'var(--accent)' }}>@{username}</span></h1>
      <p className="muted">Без регистрации. @{username} не узнает, кто вы. После отправки вы получите секретную
        ссылку, по которой увидите ответ.</p>
      <form className="card" onSubmit={submit}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX}
          placeholder="Ваш вопрос…" aria-label="Ваш вопрос" required autoFocus />
        <div className="counter">{text.length}/{MAX}</div>
        <Turnstile onToken={onToken} resetKey={captchaReset} />
        <button className="btn block" style={{ marginTop: 14 }}
          disabled={busy || !text.trim() || (captchaRequired && !captcha)}>
          {busy ? 'Отправляем…' : 'Отправить анонимно'}
        </button>
        {err && <div className="error">{err}</div>}
        <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
          @{username} может опубликовать ваш вопрос вместе с ответом в TikTok — без указания автора.
          Оскорбления и угрозы запрещены <Link href="/rules">правилами</Link>.
        </p>
      </form>
      <p className="muted small" style={{ textAlign: 'center' }}>
        Хотите свою страницу для вопросов? <Link href="/register">Создать бесплатно</Link>
      </p>
    </main>
  );
}
