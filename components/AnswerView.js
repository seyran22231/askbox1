'use client';

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** Карточка «вопрос → ответ» для отправителя. */
export default function AnswerView({ r, children }) {
  if (!r.found) {
    return (
      <div className="card">
        <p style={{ margin: 0 }}>Вопрос не найден: ссылка неверная или блогер удалил этот вопрос.</p>
        {children}
      </div>
    );
  }
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted small">Вопрос для @{r.username}</span>
        {r.status === 'answered'
          ? <span className="badge ok">Есть ответ</span>
          : <span className="badge">Ждёт ответа</span>}
      </div>
      <div className="q-text" style={{ marginTop: 8 }}>{r.question}</div>
      <div className="meta">{formatDate(r.createdAt)}</div>
      {r.status === 'answered' ? (
        <div className="a-text">
          <div className="muted small" style={{ marginBottom: 4 }}>@{r.username} ответил(а):</div>
          {r.answer}
        </div>
      ) : (
        <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>Ответа пока нет. Загляните позже по этой же ссылке.</p>
      )}
      {children}
    </div>
  );
}
