import { db } from '@/lib/db';
import { hashSecret, verifySecret, getDummyHash, hashIp, recoveryCode, normalizeRecoveryCode } from '@/lib/crypto';
import { startSession } from '@/lib/auth';
import { normalizeUsername, validatePassword } from '@/lib/validate';
import { allowAll } from '@/lib/ratelimit';
import { json, error, clientIp, sameOrigin, readJson } from '@/lib/http';

// Сброс пароля по резервному коду, выданному при регистрации.
export async function POST(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const body = await readJson(req);
  if (!body) return error('Некорректный запрос');

  const username = normalizeUsername(body.username).slice(0, 40);
  const ok = await allowAll([
    [`recover:ip:${hashIp(clientIp(req))}`, 5, 3600],
    [`recover:user:${username}`, 5, 3600],
  ]);
  if (!ok) return error('Слишком много попыток. Попробуйте через час.', 429);

  const problem = validatePassword(body.newPassword);
  if (problem) return error(problem);

  const sql = db();
  const [user] = await sql`select id, recovery_hash from app.users where username = ${username}`;
  const code = normalizeRecoveryCode(body.recoveryCode);
  const valid = await verifySecret(code, user?.recovery_hash ?? (await getDummyHash()));
  if (!user || !valid) return error('Неверный логин или код восстановления', 401);

  // Старый код больше не действует: выдаём новый. Все старые сессии закрываются.
  const newCode = recoveryCode();
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(body.newPassword), hashSecret(newCode)]);
  await sql.begin(async (tx) => {
    await tx`update app.users set password_hash = ${passwordHash}, recovery_hash = ${recoveryHash} where id = ${user.id}`;
    await tx`delete from app.sessions where user_id = ${user.id}`;
  });
  await startSession(user.id);
  return json({ ok: true, recoveryCode: newCode });
}
