CREATE TABLE IF NOT EXISTS 'projects' (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    production INT NOT NULL CHECK (production IN (0, 1))
);

CREATE TABLE IF NOT EXISTS 'controls' (
    guify_ctrl_id INTEGER PRIMARY KEY AUTOINCREMENT,
    guify_ctrl_name TEXT NOT NULL,
    guify_ctrl_type TEXT NOT NULL,
    guify_ctrl_label TEXT NOT NULL,
    guify_ctrl_required INT NOT NULL CHECK (guify_ctrl_required IN (0, 1)),
    project_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'choices' (
    ch_value TEXT NOT NULL,
    ch_label TEXT NOT NULL,
    control_id INTEGER NOT NULL,
    FOREIGN KEY (control_id) REFERENCES controls(guify_ctrl_id) ON DELETE CASCADE
);