import Link from 'next/link';
import './globals.css';
import { SITE_NAME } from '@/lib/site';

export const metadata = {
  title: { default: `${SITE_NAME} — анонимные вопросы для TikTok`, template: `%s · ${SITE_NAME}` },
  description: 'Получай анонимные вопросы от подписчиков и отвечай им лично или в сторис TikTok.',
  referrer: 'no-referrer',
  icons: { icon: '/favicon.svg' },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0e0e16' };

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className="wrap">
          <header className="topbar">
            <Link href="/" className="logo">{SITE_NAME}<span>.</span></Link>
            <nav className="toplinks">
              <Link href="/my">Мои вопросы</Link>
              <Link href="/dashboard">Кабинет</Link>
            </nav>
          </header>
          {children}
          <footer className="footer">
            <Link href="/rules">Правила и приватность</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
