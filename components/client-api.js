'use client';

/** Небольшая обёртка над fetch: JSON туда и обратно, понятная ошибка. */
export async function callApi(url, body, method = 'POST') {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('Нет соединения. Проверьте интернет и попробуйте ещё раз.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Что-то пошло не так. Попробуйте ещё раз.');
  return data;
}

const STORAGE_KEY = 'askbox_questions_v1';

/** Секретные токены хранятся только в браузере отправителя. */
export function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => x && typeof x.t === 'string') : [];
  } catch {
    return [];
  }
}

export function saveToken(token, username) {
  try {
    const list = loadSaved().filter((x) => x.t !== token);
    list.unshift({ t: token, u: username, at: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    return true;
  } catch {
    return false;
  }
}

export function forgetToken(token) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadSaved().filter((x) => x.t !== token)));
  } catch { /* хранилище недоступно — ничего страшного */ }
}

export function secretLink(token) {
  return `${window.location.origin}/a#${token}`;
}
