import { db } from '@/lib/db';
import { sha256, hashIp } from '@/lib/crypto';
import { TOKEN_RE } from '@/lib/validate';
import { allow } from '@/lib/ratelimit';
import { json, error, clientIp, readJson } from '@/lib/http';

// Отправитель получает ответ по секретному токену. Токен приходит в теле POST,
// а не в URL, поэтому не попадает в логи сервера и аналитику.
export async function POST(req) {
  const body = await readJson(req, 8_000);
  const tokens = Array.isArray(body?.tokens) ? body.tokens : null;
  if (!tokens || tokens.length === 0 || tokens.length > 50) return error('Некорректный запрос');

  if (!(await allow(`lookup:ip:${hashIp(clientIp(req))}`, 60, 60))) {
    return error('Слишком много запросов. Подождите минуту.', 429);
  }

  const valid = tokens.filter((t) => typeof t === 'string' && TOKEN_RE.test(t));
  const hashes = valid.map((t) => sha256(t));
  const sql = db();
  const rows = hashes.length
    ? await sql`
        select qa.secret_token_hash, q.question_text, q.answer_text, q.status,
               q.created_at, q.answered_at, u.username
        from app.question_access qa
        join app.questions q on q.id = qa.question_id
        join app.users u on u.id = q.creator_user_id
        where qa.secret_token_hash in ${sql(hashes)}`
    : [];

  const byHash = new Map(rows.map((r) => [Buffer.from(r.secret_token_hash).toString('hex'), r]));
  const results = tokens.map((t) => {
    const r = typeof t === 'string' && TOKEN_RE.test(t) ? byHash.get(sha256(t).toString('hex')) : null;
    if (!r) return { token: t, found: false };
    return {
      token: t,
      found: true,
      username: r.username,
      question: r.question_text,
      answer: r.answer_text,
      status: r.status,
      createdAt: r.created_at,
      answeredAt: r.answered_at,
    };
  });
  return json({ results });
}
