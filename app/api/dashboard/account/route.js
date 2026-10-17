import { db } from '@/lib/db';
import { currentUser, endSession } from '@/lib/auth';
import { verifySecret } from '@/lib/crypto';
import { json, error, sameOrigin, readJson } from '@/lib/http';

// Полное удаление аккаунта со всеми вопросами (каскадом в базе).
export async function DELETE(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const user = await currentUser();
  if (!user) return error('Нужно войти', 401);
  const body = await readJson(req);
  const sql = db();
  const [row] = await sql`select password_hash from app.users where id = ${user.id}`;
  if (!row || !(await verifySecret(String(body?.password ?? ''), row.password_hash))) {
    return error('Неверный пароль', 401);
  }
  await endSession();
  await sql`delete from app.users where id = ${user.id}`;
  return json({ ok: true });
}
