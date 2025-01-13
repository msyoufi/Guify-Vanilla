CREATE TABLE IF NOT EXISTS 'guis' (
    gui_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    gui_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS 'controls' (
    gui_id INTEGER NOT NULL,
    guify_ctrl_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    guify_ctrl_name TEXT NOT NULL,
    guify_ctrl_type TEXT NOT NULL,
    guify_ctrl_label TEXT NOT NULL,
    guify_ctrl_required INT NOT NULL CHECK (guify_ctrl_required IN ('0', '1')),
    FOREIGN KEY (gui_id) REFERENCES guis(gui_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'choices' (
    controlId INTEGER NOT NULL,
    chValue TEXT NOT NULL,
    chLabel TEXT NOT NULL,
    FOREIGN KEY (controlId) REFERENCES controls(guify_ctrl_id) ON DELETE CASCADE
);