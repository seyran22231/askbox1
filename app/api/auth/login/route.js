import { db } from '@/lib/db';
import { verifySecret, getDummyHash, hashIp } from '@/lib/crypto';
import { startSession } from '@/lib/auth';
import { normalizeUsername } from '@/lib/validate';
import { allowAll } from '@/lib/ratelimit';
import { json, error, clientIp, sameOrigin, readJson } from '@/lib/http';

export async function POST(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const body = await readJson(req);
  if (!body) return error('Некорректный запрос');

  const username = normalizeUsername(body.username).slice(0, 40);
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';

  const ok = await allowAll([
    [`login:ip:${hashIp(clientIp(req))}`, 10, 900],
    [`login:user:${username}`, 10, 900],
  ]);
  if (!ok) return error('Слишком много попыток входа. Подождите 15 минут.', 429);

  const sql = db();
  const [user] = await sql`select id, password_hash from app.users where username = ${username}`;
  const valid = await verifySecret(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !valid) return error('Неверный логин или пароль', 401);

  await startSession(user.id);
  return json({ ok: true });
}
