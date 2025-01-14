import Database from 'better-sqlite3';
import fs from 'node:fs';
import { IpcMainInvokeEvent } from 'electron';
import { pathTo } from '../../main.js';
import { dynamicInsert } from './db-utils.js';

export const db = new Database(pathTo('db/forms.db'));
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

export function insertGui(_: IpcMainInvokeEvent, guiName: string): number {
  try {
    const result = db.prepare(`
      INSERT INTO guis (gui_name) VALUES (?)
    `).run(guiName);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function deleteGui(_: IpcMainInvokeEvent, guiId: string): number {
  try {
    const result = db.prepare(`
      DELETE FROM guis WHERE gui_id = ?
    `).run(guiId);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function getGuis(_: IpcMainInvokeEvent): GUI[] {
  try {
    return db.prepare(`SELECT * FROM guis`).all() as GUI[];

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
  const { guify_ctrl_choices, guify_ctrl_id, gui_id, ...controlData } = control;
  const keys = Object.keys(controlData);
  const values = keys.map(key => key + ' = @' + key).join(', ');
  let changes = 0;

  try {
    db.transaction(() => {
      const result = db.prepare(`
        UPDATE controls SET ${values} WHERE guify_ctrl_id = ${guify_ctrl_id}
      `).run(controlData);

      changes = result.changes;

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

export function getFormControls(_: IpcMainInvokeEvent, guiId: number): FormControl[] {
  try {
    const stmnt = db.prepare(`
    SELECT controls.*, choices.* FROM controls
    LEFT JOIN choices ON controls.guify_ctrl_id = choices.control_id
    WHERE controls.gui_id = ?;
  `);

    const result: any[] = stmnt.all(guiId);

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