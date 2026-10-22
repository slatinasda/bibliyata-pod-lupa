-- Библията под лупа: схема на базата (PostgreSQL). Прилага се при всеки старт (IF NOT EXISTS навсякъде).

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Регистрации за вечер (формата „Запази си място“)
CREATE TABLE IF NOT EXISTS registrations (
  id          SERIAL PRIMARY KEY,
  episode_id  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  invited_by  TEXT,
  first_time  BOOLEAN NOT NULL DEFAULT FALSE,
  help        TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'new',  -- new | contacted | attended | cancelled
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Съобщения от формата „Пиши ни“
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',  -- new | contacted | closed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_episode ON registrations(episode_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
