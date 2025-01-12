CREATE TABLE IF NOT EXISTS 'controls' (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    guiName TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    required INT NOT NULL CHECK (required IN (0, 1))
);

CREATE TABLE IF NOT EXISTS 'choices' (
    controlId INTEGER NOT NULL,
    chValue TEXT NOT NULL,
    chLabel TEXT NOT NULL,
    FOREIGN KEY (controlId) REFERENCES controls(id) ON DELETE CASCADE
);