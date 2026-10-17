'use client';

import { useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/components/client-api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await callApi('/api/auth/login', { username, password });
      window.location.href = '/dashboard';
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Вход</h1>
      <form className="card" onSubmit={submit}>
        <label htmlFor="u">Логин</label>
        <input id="u" value={username} onChange={(e) => setUsername(e.target.value)}
          autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        <label htmlFor="p">Пароль</label>
        <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" required />
        <button className="btn block" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
        {err && <div className="error">{err}</div>}
        <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
          <Link href="/recover">Забыли пароль?</Link> · <Link href="/register">Создать страницу</Link>
        </p>
      </form>
    </main>
  );
}
