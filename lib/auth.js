import { cookies } from 'next/headers';
import { db } from './db';
import { randomToken, sha256 } from './crypto';

export const SESSION_COOKIE = 'sid';
const SESSION_DAYS = 30;

/** Создаёт сессию и ставит httpOnly-cookie. Вызывать только из Route Handler. */
export async function startSession(userId) {
  const token = randomToken();
  const sql = db();
  await sql`
    insert into app.sessions (user_id, token_hash, expires_at)
    values (${userId}, ${sha256(token)}, now() + make_interval(days => ${SESSION_DAYS}))`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Текущий блогер по cookie или null. Проверка идёт на сервере, по хешу токена. */
export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const sql = db();
  const [user] = await sql`
    select u.id, u.username, u.filter_enabled
    from app.sessions s join app.users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
  return user ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db()`delete from app.sessions where token_hash = ${sha256(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}
