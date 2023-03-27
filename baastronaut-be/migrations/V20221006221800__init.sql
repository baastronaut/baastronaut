CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY NOT NULL,
  email VARCHAR (300) NOT NULL,
  first_name VARCHAR (300),
  last_name VARCHAR (300),
  password VARCHAR (300) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT 'f',
  verified_at TIMESTAMPTZ,
  verify_token TEXT UNIQUE,
  verify_token_expires_at TIMESTAMPTZ,
  account_disabled BOOLEAN NOT NULL DEFAULT 'f',
  account_disabled_at TIMESTAMPTZ,
  reset_password_token TEXT UNIQUE,
  reset_password_token_expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ON users(lower(email));

CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR (300) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_workspaces (
  user_id INT NOT NULL,
  workspace_id INT NOT NULL,
  role VARCHAR (20) NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, workspace_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY NOT NULL,
  creator_id INT NOT NULL,
  workspace_id INT NOT NULL,
  name VARCHAR (64) NOT NULL,
  pg_schema_identifier VARCHAR (64) NOT NULL,
  pg_schema_owner VARCHAR (64) NOT NULL,
  pg_schema_owner_encrypted_pw TEXT NOT NULL,
  pg_schema_owner_enc_iv TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(creator_id) REFERENCES users(id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX ON projects(name);
CREATE UNIQUE INDEX ON projects(pg_schema_identifier);

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY NOT NULL,
  project_id INTEGER NOT NULL,
  creator_id INT NOT NULL,
  name VARCHAR (64) NOT NULL,
  description TEXT,
  pg_table_identifier VARCHAR (64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY( project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX ON tables(project_id, pg_table_identifier);

CREATE TABLE IF NOT EXISTS columns (
  id SERIAL PRIMARY KEY NOT NULL,
  table_id INTEGER NOT NULL,
  name VARCHAR (64) NOT NULL,
  description TEXT,
  column_type TEXT NOT NULL,
  required BOOLEAN NOT NULL,
  pg_column_identifier VARCHAR (64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ON columns(table_id, pg_column_identifier);