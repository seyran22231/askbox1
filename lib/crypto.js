import crypto from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function scryptAsync(password, salt, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, params.keylen,
      { N: params.N, r: params.r, p: params.p, maxmem: 64 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Хеширует пароль (или код восстановления) через scrypt со случайной солью. */
export async function hashSecret(secret) {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(secret, salt, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Проверяет секрет против сохранённого хеша за постоянное время. */
export async function verifySecret(secret, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scryptAsync(secret, Buffer.from(saltB64, 'base64'),
    { N: Number(N), r: Number(r), p: Number(p), keylen: expected.length });
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

// Хеш-заглушка, чтобы вход несуществующим логином занимал столько же времени.
let dummyHash = null;
export async function getDummyHash() {
  if (!dummyHash) dummyHash = await hashSecret('dummy-password-for-timing');
  return dummyHash;
}

/** Криптографически случайный токен (32 байта = 256 бит) в base64url. */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

/** Код восстановления вида ABCD-EFGH-JKLM-NPQR-STUV (без похожих символов). */
export function recoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(20);
  let out = '';
  for (let i = 0; i < 20; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 19) out += '-';
  }
  return out;
}

export function normalizeRecoveryCode(code) {
  const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.match(/.{1,4}/g)?.join('-') ?? '';
}

function appSecret() {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET должен быть задан и иметь длину не менее 32 символов');
    }
    return 'dev-only-insecure-secret-change-me-please';
  }
  return s;
}

/** Необратимый хеш IP для ограничения частоты. Сам IP нигде не хранится. */
export function hashIp(ip) {
  return crypto.createHmac('sha256', appSecret()).update(String(ip)).digest('base64url').slice(0, 32);
}
