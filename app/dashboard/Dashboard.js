'use client';

import { useState } from 'react';
import { callApi } from '@/components/client-api';
import CopyButton from '@/components/CopyButton';
import StoryCard from './StoryCard';

const ANSWER_MAX = 1000;

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function QuestionItem({ q, onChange, onDelete }) {
  const [answer, setAnswer] = useState(q.answer || '');
  const [editing, setEditing] = useState(q.status === 'new');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    setBusy(true);
    try {
      const data = await callApi(`/api/dashboard/questions/${q.id}`, { answer }, 'PATCH');
      onChange({ ...q, answer: data.answer, status: 'answered', answeredAt: data.answeredAt, version: Date.now() });
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Удалить вопрос навсегда? Автор больше не увидит ответ.')) return;
    setBusy(true);
    try {
      await callApi(`/api/dashboard/questions/${q.id}`, undefined, 'DELETE');
      onDelete(q.id);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="q-text">{q.question}</div>
      <div className="meta">{formatDate(q.createdAt)}</div>

      {editing ? (
        <>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={ANSWER_MAX}
            placeholder="Ваш ответ…" style={{ marginTop: 12 }} />
          <div className="counter">{answer.length}/{ANSWER_MAX}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={save} disabled={busy || !answer.trim()}>
              {busy ? 'Сохраняем…' : q.status === 'answered' ? 'Сохранить' : 'Ответить'}
            </button>
            {q.status === 'answered' && (
              <button className="btn secondary" onClick={() => { setAnswer(q.answer); setEditing(false); }}>Отмена</button>
            )}
            <span className="grow" />
            <button className="btn danger" onClick={remove} disabled={busy}>Удалить</button>
          </div>
        </>
      ) : (
        <>
          <div className="a-text">{q.answer}</div>
          <div className="meta">Ответ виден автору вопроса по его секретной ссылке</div>
          <StoryCard id={q.id} version={q.version || q.answeredAt} />
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn ghost" onClick={() => setEditing(true)}>Изменить ответ</button>
            <span className="grow" />
            <button className="btn ghost" style={{ color: 'var(--danger)' }} onClick={remove} disabled={busy}>Удалить</button>
          </div>
        </>
      )}
      {err && <div className="error">{err}</div>}
    </div>
  );
}

export default function Dashboard({ username, filterEnabled, profileUrl, qrSmall, qrLarge, initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [tab, setTab] = useState('new');
  const [filter, setFilter] = useState(filterEnabled);
  const [settingsErr, setSettingsErr] = useState('');
  // Вопросы, на которые ответили сейчас, остаются во вкладке «Новые» до перезагрузки,
  // чтобы сразу была видна кнопка карточки для сторис.
  const [justAnswered, setJustAnswered] = useState(() => new Set());

  const fresh = questions.filter((q) => q.status === 'new' || justAnswered.has(q.id));
  const newCount = questions.filter((q) => q.status === 'new').length;
  const answered = questions.filter((q) => q.status === 'answered')
    .sort((a, b) => (b.answeredAt || '').localeCompare(a.answeredAt || ''));
  const list = tab === 'new' ? fresh : answered;

  const update = (nq) => {
    if (tab === 'new') setJustAnswered((set) => new Set(set).add(nq.id));
    setQuestions((all) => all.map((q) => (q.id === nq.id ? nq : q)));
  };
  const remove = (id) => setQuestions((all) => all.filter((q) => q.id !== id));

  async function toggleFilter(value) {
    setSettingsErr('');
    setFilter(value);
    try {
      await callApi('/api/dashboard/settings', { filterEnabled: value }, 'PATCH');
    } catch (e) {
      setFilter(!value);
      setSettingsErr(e.message);
    }
  }

  async function logout() {
    await callApi('/api/auth/logout', {}).catch(() => {});
    window.location.href = '/';
  }

  async function deleteAccount() {
    const password = window.prompt('Удаление аккаунта необратимо: все вопросы и ответы исчезнут. Введите пароль для подтверждения:');
    if (!password) return;
    try {
      await callApi('/api/dashboard/account', { password }, 'DELETE');
      window.location.href = '/';
    } catch (e) {
      setSettingsErr(e.message);
    }
  }

  return (
    <main>
      <h1>Привет, @{username}</h1>

      <div className="card hero">
        <div className="qr">
          <img src={qrSmall} alt="QR-код вашей страницы" />
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div className="muted small">Ваша ссылка для вопросов</div>
            <div className="link-box">{profileUrl.replace(/^https?:\/\//, '')}</div>
            <div className="row" style={{ marginTop: 10 }}>
              <CopyButton text={profileUrl} label="Скопировать ссылку" />
              <a className="btn secondary" href={qrLarge} download={`qr-${username}.png`}>Скачать QR</a>
            </div>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
          Совет: зрителю неудобно сканировать QR с того же телефона, на котором он смотрит сторис. Добавьте ссылку
          в профиль TikTok и напишите её текстом прямо в сторис — короткий адрес легко набрать.
        </p>
      </div>

      <div className="tabs" role="tablist">
        <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>Новые · {newCount}</button>
        <button className={tab === 'answered' ? 'active' : ''} onClick={() => setTab('answered')}>Отвеченные · {answered.length}</button>
      </div>

      {list.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
          {tab === 'new' ? 'Новых вопросов пока нет. Поделитесь ссылкой в TikTok!' : 'Здесь появятся вопросы, на которые вы ответили.'}
        </p>
      )}
      {list.map((q) => <QuestionItem key={q.id} q={q} onChange={update} onDelete={remove} />)}

      <h2>Настройки</h2>
      <div className="card">
        <label className="switch" style={{ margin: 0 }}>
          <input type="checkbox" checked={filter} onChange={(e) => toggleFilter(e.target.checked)} />
          Не принимать вопросы с матом и угрозами
        </label>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn secondary" onClick={logout}>Выйти</button>
          <span className="grow" />
          <button className="btn danger" onClick={deleteAccount}>Удалить аккаунт</button>
        </div>
        {settingsErr && <div className="error">{settingsErr}</div>}
      </div>
    </main>
  );
}
