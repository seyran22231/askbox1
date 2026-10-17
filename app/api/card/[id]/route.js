import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { UUID_RE } from '@/lib/validate';
import { SITE_NAME } from '@/lib/site';

export const runtime = 'nodejs';

const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/manrope/files');
let fontsPromise = null;

function loadFonts() {
  if (!fontsPromise) {
    const files = [];
    for (const subset of ['cyrillic', 'latin']) {
      for (const weight of [500, 700, 800]) files.push({ subset, weight });
    }
    fontsPromise = Promise.all(files.map(async ({ subset, weight }) => ({
      name: subset === 'latin' ? 'Manrope' : 'ManropeCyr',
      weight,
      style: 'normal',
      data: await readFile(path.join(FONT_DIR, `manrope-${subset}-${weight}-normal.woff`)),
    })));
  }
  return fontsPromise;
}

function questionSize(len) {
  if (len <= 60) return 64;
  if (len <= 140) return 54;
  if (len <= 260) return 44;
  if (len <= 380) return 38;
  return 34;
}

function answerSize(len, qLen) {
  const budget = len + qLen * 0.8;
  if (budget <= 120) return 56;
  if (budget <= 260) return 46;
  if (budget <= 480) return 38;
  if (budget <= 800) return 32;
  if (budget <= 1100) return 28;
  return 25;
}

// Вертикальная картинка 1080×1920 для TikTok Story. Доступна только владельцу вопроса.
// На картинке нет ничего об отправителе и нет секретной ссылки.
export async function GET(req, { params }) {
  const user = await currentUser();
  if (!user) return new Response('Нужно войти', { status: 401 });
  const { id } = await params;
  if (!UUID_RE.test(id)) return new Response('Не найдено', { status: 404 });

  const [q] = await db()`
    select question_text, answer_text from app.questions
    where id = ${id} and creator_user_id = ${user.id} and status = 'answered'`;
  if (!q) return new Response('Не найдено', { status: 404 });

  // Эмодзи подгружаются с CDN. Если CDN недоступен — рисуем карточку без них.
  let png;
  try {
    png = await render(q.question_text, q.answer_text, user.username, 'twemoji');
  } catch {
    png = await render(stripEmoji(q.question_text), stripEmoji(q.answer_text), user.username, undefined);
  }

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="story-${id.slice(0, 8)}.png"`,
    },
  });
}

function stripEmoji(text) {
  return text.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, '').trim() || '…';
}

async function render(qText, aText, username, emoji) {
  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '260px 72px 380px',
          background: 'linear-gradient(160deg, #0f0f1a 0%, #25113a 45%, #0c2a3a 100%)',
          fontFamily: 'Manrope, ManropeCyr', color: '#fff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 48, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 56px 52px', background: 'linear-gradient(135deg, #fe2c55 0%, #ff6a3d 100%)' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85, marginBottom: 20 }}>
              Анонимный вопрос
            </div>
            <div style={{ display: 'flex', fontSize: questionSize(qText.length), fontWeight: 800, lineHeight: 1.22, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {qText}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '44px 56px 52px', background: '#ffffff', color: '#14141f' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#6b6b80', marginBottom: 18 }}>
              {`@${username} отвечает:`}
            </div>
            <div style={{ display: 'flex', fontSize: answerSize(aText.length, qText.length), fontWeight: 500, lineHeight: 1.35, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {aText}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44, fontSize: 34, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
          {`Задай мне вопрос анонимно · ${SITE_NAME}`}
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: await loadFonts(), ...(emoji ? { emoji } : {}) },
  );
  return image.arrayBuffer();
}
