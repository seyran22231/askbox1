'use client';

import { useState } from 'react';
import { callApi } from '@/components/client-api';
import CopyButton from '@/components/CopyButton';

export default function RecoverPage() {
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [newCode, setNewCode] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const data = await callApi('/api/auth/recover', { username, recoveryCode, newPassword });
      setNewCode(data.recoveryCode);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  if (newCode) {
    return (
      <main>
        <h1>Пароль изменён</h1>
        <div className="card">
          <p>Старый код восстановления больше не действует. <b>Сохраните новый</b> — он показывается один раз:</p>
          <div className="secret code-big">{newCode}</div>
          <div className="row">
            <CopyButton text={newCode} label="Скопировать код" />
            <a className="btn" href="/dashboard">В кабинет</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1>Восстановление пароля</h1>
      <p className="muted">Введите код восстановления, который вы получили при регистрации. Без него восстановить доступ
        нельзя — у нас нет вашей почты или телефона.</p>
      <form className="card" onSubmit={submit}>
        <label htmlFor="u">Логин</label>
        <input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required />
        <label htmlFor="c">Код восстановления</label>
        <input id="c" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autoCapitalize="characters" spellCheck={false} required />
        <label htmlFor="p">Новый пароль</label>
        <input id="p" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password" minLength={8} required />
        <button className="btn block" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Проверяем…' : 'Сменить пароль'}</button>
        {err && <div className="error">{err}</div>}
      </form>
    </main>
  );
}
