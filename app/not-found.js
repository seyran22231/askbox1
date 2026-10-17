import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <h1>Страница не найдена</h1>
      <p className="muted">Возможно, в ссылке опечатка или блогер удалил свою страницу.</p>
      <Link href="/" className="btn secondary">На главную</Link>
    </main>
  );
}
