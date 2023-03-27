CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by_user_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL UNIQUE, -- We only support one api token per project for now.
  token TEXT NOT NULL UNIQUE,
  read_only BOOLEAN NOT NULL DEFAULT 't',
  FOREIGN KEY (generated_by_user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);