import { db } from '@/lib/db';
import { randomToken, sha256, hashIp } from '@/lib/crypto';
import { normalizeUsername, cleanText, LIMITS } from '@/lib/validate';
import { isOffensive } from '@/lib/filter';
import { allowAll } from '@/lib/ratelimit';
import { verifyCaptcha } from '@/lib/turnstile';
import { json, error, clientIp, sameOrigin, readJson } from '@/lib/http';

// Публичная отправка анонимного вопроса. Ничего о личности отправителя не сохраняется.
export async function POST(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  const body = await readJson(req);
  if (!body) return error('Некорректный запрос');

  const ip = clientIp(req);
  const ipKey = hashIp(ip);
  const username = normalizeUsername(body.username).slice(0, 40);
  const text = cleanText(body.question);

  if (!text) return error('Напишите вопрос');
  if (text.length > LIMITS.question) return error(`Вопрос не длиннее ${LIMITS.question} символов`);

  const ok = await allowAll([
    [`ask:ip:${ipKey}`, 5, 60],
    [`ask:ip-hour:${ipKey}`, 30, 3600],
    [`ask:user:${username}`, 300, 3600],
  ]);
  if (!ok) return error('Слишком много вопросов подряд. Немного подождите.', 429);
  if (!(await verifyCaptcha(body.captcha, ip))) return error('Подтвердите, что вы не робот');

  const sql = db();
  const [creator] = await sql`select id, filter_enabled from app.users where username = ${username}`;
  if (!creator) return error('Такой страницы нет', 404);
  if (creator.filter_enabled && isOffensive(text)) {
    return error('Вопрос не отправлен: в нём есть оскорбления или угрозы. Переформулируйте, пожалуйста.');
  }

  const token = randomToken();
  await sql.begin(async (tx) => {
    const [q] = await tx`
      insert into app.questions (creator_user_id, question_text)
      values (${creator.id}, ${text})
      returning id`;
    await tx`insert into app.question_access (question_id, secret_token_hash) values (${q.id}, ${sha256(token)})`;
  });

  // Токен показывается отправителю один раз; в базе хранится только SHA-256.
  return json({ ok: true, token });
}
