import { endSession } from '@/lib/auth';
import { json, error, sameOrigin } from '@/lib/http';

export async function POST(req) {
  if (!sameOrigin(req)) return error('Запрос отклонён', 403);
  await endSession();
  return json({ ok: true });
}
