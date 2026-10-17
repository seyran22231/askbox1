import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export default function Home() {
  return (
    <main>
      <div className="card hero">
        <h1>Анонимные вопросы от подписчиков TikTok</h1>
        <p className="muted">
          Получи свою ссылку и QR-код, размести их в TikTok — подписчики зададут вопросы без регистрации.
          Отвечай лично каждому или выкладывай красивую карточку с ответом в сторис.
        </p>
        <div className="row" style={{ marginTop: 16 }}>
          <Link href="/register" className="btn">Создать страницу</Link>
          <Link href="/login" className="btn secondary">Войти</Link>
        </div>
      </div>

      <h2>Как это работает</h2>
      <div className="card">
        <p><b>1. Регистрация за 10 секунд.</b> Только логин и пароль — без почты и телефона.</p>
        <p><b>2. Ссылка и QR-код.</b> Добавь ссылку в профиль или покажи QR в сторис.</p>
        <p><b>3. Анонимные вопросы.</b> Подписчик пишет вопрос — ты не видишь, кто он.</p>
        <p style={{ marginBottom: 0 }}><b>4. Ответ.</b> Автор вопроса читает ответ по своей секретной ссылке, а ты можешь
          одним нажатием сделать картинку 9:16 для TikTok Story.</p>
      </div>

      <p className="muted small">Задали вопрос и хотите посмотреть ответ? Откройте <Link href="/my">Мои вопросы</Link> на том же
        устройстве или свою секретную ссылку.</p>
      <p className="muted small">{SITE_NAME} не связан с TikTok и не является его официальным сервисом.</p>
    </main>
  );
}
