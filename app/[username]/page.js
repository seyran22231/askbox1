import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { normalizeUsername } from '@/lib/validate';
import AskForm from './AskForm';

export const dynamic = 'force-dynamic';

async function findUser(raw) {
  const username = normalizeUsername(decodeURIComponent(raw));
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return null;
  const [user] = await db()`select username from app.users where username = ${username}`;
  return user ?? null;
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return { title: 'Страница не найдена' };
  return {
    title: `Задай анонимный вопрос @${user.username}`,
    description: `Анонимный вопрос для @${user.username}. Без регистрации.`,
  };
}

export default async function AskPage({ params }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) notFound();
  return <AskForm username={user.username} />;
}
