import postgres from 'postgres';

// Одно подключение на процесс. prepare:false нужен для пулера Supabase (порт 6543).
const globalForDb = globalThis;

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Не задана переменная окружения DATABASE_URL');
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return postgres(url, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : 'require',
  });
}

export function db() {
  if (!globalForDb.__askboxSql) globalForDb.__askboxSql = createClient();
  return globalForDb.__askboxSql;
}
