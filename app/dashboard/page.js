import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { siteOrigin } from '@/lib/site';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Кабинет', robots: { index: false } };

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  // Выбираем только вопросы текущего блогера — условие стоит в самом SQL-запросе.
  const rows = await db()`
    select id, question_text, answer_text, status, created_at, answered_at
    from app.questions
    where creator_user_id = ${user.id}
    order by created_at desc
    limit 500`;

  const questions = rows.map((r) => ({
    id: r.id,
    question: r.question_text,
    answer: r.answer_text,
    status: r.status,
    createdAt: r.created_at.toISOString(),
    answeredAt: r.answered_at ? r.answered_at.toISOString() : null,
  }));

  const profileUrl = `${await siteOrigin()}/${user.username}`;
  const qrOptions = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } };
  const [qrSmall, qrLarge] = await Promise.all([
    QRCode.toDataURL(profileUrl, { ...qrOptions, width: 300 }),
    QRCode.toDataURL(profileUrl, { ...qrOptions, width: 1000 }),
  ]);

  return (
    <Dashboard
      username={user.username}
      filterEnabled={user.filter_enabled}
      profileUrl={profileUrl}
      qrSmall={qrSmall}
      qrLarge={qrLarge}
      initialQuestions={questions}
    />
  );
}
