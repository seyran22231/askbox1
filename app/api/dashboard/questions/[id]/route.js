import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { cleanText, LIMITS, UUID_RE } from '@/lib/validate';
import { json, error, sameOrigin, readJson } from '@/lib/http';

// Ответ на вопрос. Условие creator_user_id = текущий пользователь стоит прямо в SQL:
// чужой вопрос нельзя изменить, даже зная его ID.
export async function PATCH(req, { params }) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const user = await currentUser();
  if (!user) return error('Нужно войти', 401);
  const { id } = await params;
  if (!UUID_RE.test(id)) return error('Вопрос не найден', 404);

  const body = await readJson(req);
  const answer = cleanText(body?.answer);
  if (!answer) return error('Напишите ответ');
  if (answer.length > LIMITS.answer) return error(`Ответ не длиннее ${LIMITS.answer} символов`);

  const [row] = await db()`
    update app.questions
    set answer_text = ${answer}, status = 'answered', answered_at = coalesce(answered_at, now())
    where id = ${id} and creator_user_id = ${user.id}
    returning id, answer_text, answered_at`;
  if (!row) return error('Вопрос не найден', 404);
  return json({ ok: true, answer: row.answer_text, answeredAt: row.answered_at });
}

export async function DELETE(req, { params }) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const user = await currentUser();
  if (!user) return error('Нужно войти', 401);
  const { id } = await params;
  if (!UUID_RE.test(id)) return error('Вопрос не найден', 404);

  const rows = await db()`
    delete from app.questions where id = ${id} and creator_user_id = ${user.id} returning id`;
  if (rows.length === 0) return error('Вопрос не найден', 404);
  return json({ ok: true });
}
