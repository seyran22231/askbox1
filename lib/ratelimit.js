import { db } from './db';

/**
 * Счётчик с фиксированным окном. Возвращает true, если лимит НЕ превышен.
 * key — например `ask:ip:<хеш IP>`; limit — сколько запросов; windowSec — окно в секундах.
 */
export async function allow(key, limit, windowSec) {
  const sql = db();
  const [row] = await sql`
    insert into app.rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when app.rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                   then 1 else app.rate_limits.count + 1 end,
      window_start = case when app.rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                   then now() else app.rate_limits.window_start end
    returning count`;

  // Изредка чистим старые записи, чтобы таблица не росла.
  if (Math.random() < 0.01) {
    await sql`delete from app.rate_limits where window_start < now() - interval '2 days'`;
  }
  return row.count <= limit;
}

/** Проверяет несколько лимитов сразу; true, только если все в норме. */
export async function allowAll(rules) {
  for (const [key, limit, windowSec] of rules) {
    if (!(await allow(key, limit, windowSec))) return false;
  }
  return true;
}
