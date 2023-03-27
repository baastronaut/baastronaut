CREATE TABLE IF NOT EXISTS workspace_invites (
  id SERIAL PRIMARY KEY NOT NULL,
  workspace_id INT NOT NULL,
  inviter_id INT NOT NULL,
  email VARCHAR (300) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY(inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (workspace_id, email)
);