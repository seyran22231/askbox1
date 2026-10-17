'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/components/client-api';
import CopyButton from '@/components/CopyButton';
import Turnstile, { captchaRequired } from '@/components/Turnstile';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [saved, setSaved] = useState(false);
  const onToken = useCallback((t) => setCaptcha(t), []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password !== password2) return setErr('Пароли не совпадают');
    setBusy(true);
    try {
      const data = await callApi('/api/auth/register', { username, password, captcha });
      setCode(data.recoveryCode);
    } catch (e2) {
      setErr(e2.message);
      setCaptchaReset((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <main>
        <h1>Страница создана 🎉</h1>
        <div className="card">
          <p><b>Сохраните код восстановления.</b> У нас нет вашей почты, поэтому без этого кода забытый пароль
            восстановить невозможно. Код показывается только один раз.</p>
          <div className="secret code-big">{code}</div>
          <div className="row">
            <CopyButton text={code} label="Скопировать код" />
          </div>
          <label className="switch" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            Я сохранил(а) код в надёжном месте
          </label>
          <button className="btn block" style={{ marginTop: 16 }} disabled={!saved}
            onClick={() => { window.location.href = '/dashboard'; }}>
            Перейти в кабинет
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1>Создать страницу</h1>
      <p className="muted">Нужны только логин и пароль. Логин станет адресом вашей страницы.</p>
      <form className="card" onSubmit={submit}>
        <label htmlFor="u">Логин</label>
        <input id="u" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
          autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24}
          placeholder="например, katya_dance" required />
        <div className="counter">латинские буквы, цифры и _ · 3–24 символа</div>
        <label htmlFor="p">Пароль</label>
        <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" minLength={8} maxLength={128} required />
        <label htmlFor="p2">Пароль ещё раз</label>
        <input id="p2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password" minLength={8} maxLength={128} required />
        <Turnstile onToken={onToken} resetKey={captchaReset} />
        <button className="btn block" style={{ marginTop: 18 }} disabled={busy || (captchaRequired && !captcha)}>
          {busy ? 'Создаём…' : 'Создать'}
        </button>
        {err && <div className="error">{err}</div>}
        <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
          Регистрируясь, вы принимаете <Link href="/rules">правила</Link>. Уже есть страница? <Link href="/login">Войти</Link>
        </p>
      </form>
    </main>
  );
}
