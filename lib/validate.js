export const LIMITS = {
  question: 500,
  answer: 1000,
  passwordMin: 8,
  passwordMax: 128,
};

// Имена, которые совпадают с адресами страниц сайта.
const RESERVED = new Set([
  'a', 'api', 'my', 'login', 'logout', 'register', 'recover', 'dashboard', 'rules',
  'privacy', 'terms', 'admin', 'support', 'help', 'about', 'settings', 'static',
  'public', 'assets', 'favicon', 'robots', 'sitemap', 'www', 'root', 'null', 'undefined',
]);

export function normalizeUsername(raw) {
  return String(raw || '').trim().replace(/^@/, '').toLowerCase();
}

export function validateUsername(username) {
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return 'Логин: от 3 до 24 символов — латинские буквы, цифры и _';
  }
  if (RESERVED.has(username)) return 'Этот логин занят, выберите другой';
  return null;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < LIMITS.passwordMin) {
    return `Пароль должен быть не короче ${LIMITS.passwordMin} символов`;
  }
  if (password.length > LIMITS.passwordMax) return 'Пароль слишком длинный';
  return null;
}

/** Обрезает пробелы, убирает управляющие символы, схлопывает пустые строки. */
export function cleanText(raw) {
  return String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
