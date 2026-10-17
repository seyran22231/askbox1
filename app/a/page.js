'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi, saveToken } from '@/components/client-api';
import AnswerView from '@/components/AnswerView';

// Секретный токен находится после «#» в адресе. Эта часть адреса никогда не
// отправляется на сервер и не попадает в логи — страница сама передаёт его в POST.
function extractToken(value) {
  const m = String(value || '').match(/[A-Za-z0-9_-]{43}/);
  return m ? m[0] : '';
}

export default function SecretAnswerPage() {
  const [state, setState] = useState('loading'); // loading | none | done | error
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');

  async function load(token) {
    setState('loading');
    setErr('');
    try {
      const data = await callApi('/api/lookup', { tokens: [token] });
      const r = data.results[0];
      setResult(r);
      setState('done');
      if (r.found) saveToken(token, r.username);
    } catch (e) {
      setErr(e.message);
      setState('error');
    }
  }

  useEffect(() => {
    const token = extractToken(window.location.hash);
    if (token) load(token);
    else setState('none');
  }, []);

  function openManual(e) {
    e.preventDefault();
    const token = extractToken(manual);
    if (!token) return setErr('Это не похоже на секретную ссылку');
    window.history.replaceState(null, '', `/a#${token}`);
    load(token);
  }

  return (
    <main>
      <h1>Ответ на ваш вопрос</h1>
      {state === 'loading' && <p className="muted">Загружаем…</p>}
      {state === 'done' && result && <AnswerView r={result} />}
      {(state === 'none' || state === 'error') && (
        <form className="card" onSubmit={openManual}>
          <label htmlFor="l" style={{ marginTop: 0 }}>Вставьте свою секретную ссылку</label>
          <input id="l" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="https://…/a#…" />
          <button className="btn block" style={{ marginTop: 12 }}>Открыть</button>
          {err && <div className="error">{err}</div>}
        </form>
      )}
      <p className="muted small">Все вопросы, заданные с этого устройства, — в разделе <Link href="/my">Мои вопросы</Link>.</p>
    </main>
  );
}
