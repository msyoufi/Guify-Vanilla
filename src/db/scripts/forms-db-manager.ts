import Database from 'better-sqlite3';
import fs from 'node:fs';
import { IpcMainInvokeEvent } from 'electron';
import { pathTo } from '../../main.js';
import { dynamicInsert, dynamicUpdate } from './db-utils.js';

const db = new Database(pathTo('db/forms.db'));
db.pragma('journal_mode = WAL');

initDB();

function initDB(): void {
  try {
    const migration = fs.readFileSync(pathTo('db/scripts/forms-schema.sql'), 'utf-8');
    db.exec(migration);

  } catch (err: unknown) {
    throw err;
  }
}

export function insertProject(_: IpcMainInvokeEvent, projectName: string): number {
  try {
    const result = db.prepare(`
      INSERT INTO projects (name, production) VALUES (?, 0)
    `).run(projectName);

    return result.lastInsertRowid as number;

  } catch (err: unknown) {
    throw err;
  }
}

export function updateProject(_: IpcMainInvokeEvent, projectId: number, column: string, value: any): number {
  try {
    const result = db.prepare(`
      UPDATE projects SET ${column} = @value WHERE id = @projectId
    `).run({ value, projectId });

    return result.changes;
  } catch (err: unknown) {
    throw err;
  }
}

export function deleteProject(projectId: number): number {
  try {
    const result = db.prepare(`
      DELETE FROM projects WHERE id = ?
    `).run(projectId);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function getProjects(_: IpcMainInvokeEvent): GuifyProject[] {
  try {
    return db.prepare(`SELECT * FROM projects`).all() as GuifyProject[];

  } catch (err: unknown) {
    throw err;
  }
}

export function insertFormControl(_: IpcMainInvokeEvent, control: NewFormControl): number {
  const { guify_ctrl_choices, ...controlData } = control;
  let changes = 0;

  try {
    db.transaction(() => {
      const result = dynamicInsert(db, 'controls', controlData);
      changes = result.changes;

      if (guify_ctrl_choices.length) {
        const insertStmnt = db.prepare(`
          INSERT INTO choices (ch_value, ch_label, control_id) VALUES (@ch_value, @ch_label, @control_id)
        `);

        const control_id = result.lastInsertRowid;

        for (const choice of guify_ctrl_choices)
          insertStmnt.run({ control_id, ...choice });
      }
    })();

    return changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function updateFormControl(_: IpcMainInvokeEvent, control: FormControl): number {
  const { guify_ctrl_choices, guify_ctrl_id, project_id, ...controlData } = control;
  let changes = 0;

  try {
    db.transaction(() => {
      changes = dynamicUpdate(db, 'controls', controlData, `guify_ctrl_id = ${guify_ctrl_id}`);

      if (changes) {
        db.prepare(`
          DELETE FROM choices WHERE control_id = ${guify_ctrl_id}
        `).run();

        if (guify_ctrl_choices.length) {
          const insertStmnt = db.prepare(`
            INSERT INTO choices (ch_value, ch_label, control_id) VALUES (@ch_value, @ch_label, @control_id)
          `);

          for (const choice of guify_ctrl_choices)
            insertStmnt.run({ control_id: guify_ctrl_id, ...choice });
        }
      }
    })();

    return changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function deleteFormControl(_: IpcMainInvokeEvent, id: string): number {
  try {
    const result = db.prepare(`
      DELETE FROM controls WHERE guify_ctrl_id = ?
    `).run(id);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function getFormControls(_: IpcMainInvokeEvent, projectId: number): FormControl[] {
  try {
    const stmnt = db.prepare(`
    SELECT controls.*, choices.* FROM controls
    LEFT JOIN choices ON controls.guify_ctrl_id = choices.control_id
    WHERE controls.project_id = ?;
  `);

    const result: any[] = stmnt.all(projectId);

    if (!result.length) return [];

    const controls: Record<number, FormControl> = {};

    for (const ctrl of result) {
      const { ch_label, ch_value, control_id, ...ctrlData } = ctrl;
      const id = ctrl.guify_ctrl_id;
      ctrlData.guify_ctrl_choices = [];

      if (!controls[id])
        controls[id] = ctrlData;

      if (control_id)
        controls[id].guify_ctrl_choices.push({ ch_value, ch_label });
    }

    return Object.values(controls);

  } catch (err: unknown) {
    throw err;
  }
}

export function close(): void {
  try {
    db.close();
  } catch (err: unknown) {
    throw err;
  }
}