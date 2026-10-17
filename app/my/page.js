'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi, loadSaved, forgetToken, secretLink } from '@/components/client-api';
import AnswerView from '@/components/AnswerView';
import CopyButton from '@/components/CopyButton';

export default function MyQuestionsPage() {
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const saved = loadSaved();
    if (saved.length === 0) { setState('empty'); return; }
    callApi('/api/lookup', { tokens: saved.map((s) => s.t) })
      .then((data) => { setResults(data.results); setState('done'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);

  function forget(token) {
    forgetToken(token);
    setResults((all) => all.filter((r) => r.token !== token));
  }

  return (
    <main>
      <h1>Мои вопросы</h1>
      <p className="muted small">Здесь вопросы, которые вы задали с этого браузера. Мы не знаем, кто вы, — список хранится
        только на вашем устройстве. Чтобы открыть ответ на другом телефоне, используйте секретную ссылку.</p>
      {state === 'loading' && <p className="muted">Загружаем…</p>}
      {state === 'error' && <p className="error">{err}</p>}
      {state === 'empty' && <div className="card"><p style={{ margin: 0 }}>С этого браузера вопросов ещё не задавали.</p></div>}
      {state === 'done' && results.length === 0 && <div className="card"><p style={{ margin: 0 }}>Список пуст.</p></div>}
      {results.map((r) => (
        <AnswerView key={r.token} r={r}>
          <div className="row" style={{ marginTop: 10 }}>
            {r.found && <CopyButton text={secretLink(r.token)} label="Скопировать ссылку" className="btn ghost" />}
            <span className="grow" />
            <button className="btn ghost" onClick={() => forget(r.token)}>Убрать из списка</button>
          </div>
        </AnswerView>
      ))}
      <p className="muted small"><Link href="/a">Открыть ответ по ссылке</Link></p>
    </main>
  );
}
