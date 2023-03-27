CREATE TABLE IF NOT EXISTS fts_groups (
  id SERIAL PRIMARY KEY NOT NULL,
  table_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
);

CREATE INDEX ON fts_groups (table_id);

CREATE TABLE IF NOT EXISTS fts_group_columns (
  fts_group_id INTEGER NOT NULL,
  column_id INTEGER NOT NULL,
  weight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (fts_group_id, column_id),
  FOREIGN KEY(fts_group_id) REFERENCES fts_groups(id) ON DELETE CASCADE,
  FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE
);
