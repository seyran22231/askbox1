import { db } from '@/lib/db';
import { hashSecret, hashIp, recoveryCode } from '@/lib/crypto';
import { startSession } from '@/lib/auth';
import { normalizeUsername, validateUsername, validatePassword } from '@/lib/validate';
import { allowAll } from '@/lib/ratelimit';
import { verifyCaptcha } from '@/lib/turnstile';
import { json, error, clientIp, sameOrigin, readJson } from '@/lib/http';

export async function POST(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const body = await readJson(req);
  if (!body) return error('Некорректный запрос');

  const ip = clientIp(req);
  if (!(await allowAll([[`reg:ip:${hashIp(ip)}`, 5, 3600]]))) {
    return error('Слишком много регистраций. Попробуйте через час.', 429);
  }
  if (!(await verifyCaptcha(body.captcha, ip))) return error('Подтвердите, что вы не робот');

  const username = normalizeUsername(body.username);
  const password = body.password;
  const problem = validateUsername(username) || validatePassword(password);
  if (problem) return error(problem);

  const code = recoveryCode();
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(password), hashSecret(code)]);

  const sql = db();
  const [user] = await sql`
    insert into app.users (username, password_hash, recovery_hash)
    values (${username}, ${passwordHash}, ${recoveryHash})
    on conflict (username) do nothing
    returning id`;
  if (!user) return error('Этот логин уже занят');

  await startSession(user.id);
  // Код восстановления показывается один раз — в базе только его хеш.
  return json({ ok: true, username, recoveryCode: code });
}
