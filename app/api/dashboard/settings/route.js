import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { json, error, sameOrigin, readJson } from '@/lib/http';

export async function PATCH(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const user = await currentUser();
  if (!user) return error('Нужно войти', 401);
  const body = await readJson(req);
  if (typeof body?.filterEnabled !== 'boolean') return error('Некорректный запрос');
  await db()`update app.users set filter_enabled = ${body.filterEnabled} where id = ${user.id}`;
  return json({ ok: true });
}
