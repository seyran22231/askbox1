-- ============================================================
-- Схема базы данных сервиса анонимных вопросов.
-- Запустить ОДИН раз: Supabase -> SQL Editor -> вставить всё -> Run.
--
-- Все таблицы лежат в отдельной схеме "app", которую Supabase НЕ
-- открывает через свой публичный API. На всех таблицах включён RLS
-- без разрешающих политик: роли anon/authenticated не видят ничего.
-- Доступ к данным есть только у сервера сайта (через DATABASE_URL),
-- и права владельца проверяются в коде на каждом запросе.
-- ============================================================

create schema if not exists app;
revoke all on schema app from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema app from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema app from authenticated';
  end if;
end $$;

-- Блогеры: только логин + пароль. Никакой почты и телефона.
create table if not exists app.users (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique
                 check (username ~ '^[a-z0-9_]{3,24}$'),
  password_hash  text not null,            -- scrypt, не открытый текст
  recovery_hash  text not null,            -- хеш резервного кода восстановления
  filter_enabled boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Сессии входа. В cookie лежит случайный токен, в базе — только его хеш.
create table if not exists app.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app.users(id) on delete cascade,
  token_hash  bytea not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists sessions_user_idx on app.sessions(user_id);

-- Вопросы. ID — случайный UUID, а не порядковый номер (не угадать).
create table if not exists app.questions (
  id              uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references app.users(id) on delete cascade,
  question_text   text not null check (char_length(question_text) between 1 and 500),
  answer_text     text check (answer_text is null or char_length(answer_text) between 1 and 1000),
  status          text not null default 'new' check (status in ('new', 'answered')),
  created_at      timestamptz not null default now(),
  answered_at     timestamptz
);
create index if not exists questions_owner_idx
  on app.questions(creator_user_id, status, created_at desc);

-- Секретный доступ отправителя к ответу. Хранится только SHA-256 токена.
create table if not exists app.question_access (
  question_id       uuid primary key references app.questions(id) on delete cascade,
  secret_token_hash bytea not null unique,
  created_at        timestamptz not null default now()
);

-- Ограничение частоты запросов. Ключ содержит хеш IP, а не сам IP.
create table if not exists app.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        integer not null
);

alter table app.users           enable row level security;
alter table app.sessions        enable row level security;
alter table app.questions       enable row level security;
alter table app.question_access enable row level security;
alter table app.rate_limits     enable row level security;
