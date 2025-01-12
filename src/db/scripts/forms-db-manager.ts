import Database from 'better-sqlite3';
import { IpcMainInvokeEvent } from 'electron';
import { pathTo } from '../../main.js';
import { dynamicInsert } from './db-utils.js';
import fs from 'node:fs';

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

export function insertFormControl(event: IpcMainInvokeEvent, control: FormControlNoID): number {
  const { choices, ...controlData } = control;
  let changes = 0;

  try {
    db.transaction(() => {
      const result = dynamicInsert(db, 'controls', controlData);
      changes = result.changes;

      if (choices.length) {
        const insertStmnt = db.prepare(`
          INSERT INTO choices (chValue, chLabel, controlId) VALUES (@chValue, @chLabel, @controlId)
        `);

        const controlId = result.lastInsertRowid;

        for (const choice of choices)
          insertStmnt.run({ controlId, ...choice });
      }
    })();

    return changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function updateFormControl(event: IpcMainInvokeEvent, control: FormControl): number {
  const { choices, id, guiName, ...controlData } = control;
  const keys = Object.keys(controlData);
  const values = keys.map(key => key + ' = @' + key).join(', ');
  let changes = 0;

  try {
    db.transaction(() => {
      const result = db.prepare(`
        UPDATE controls SET ${values} WHERE id = ${id}
      `).run(controlData);

      changes = result.changes;

      if (changes) {
        db.prepare(`
          DELETE FROM choices WHERE controlId = ${id}
        `).run();

        if (choices.length) {
          const insertStmnt = db.prepare(`
            INSERT INTO choices (chValue, chLabel, controlId) VALUES (@chValue, @chLabel, @controlId)
          `);

          for (const choice of choices)
            insertStmnt.run({ controlId: id, ...choice });
        }
      }
    })();

    return changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function deleteFormControl(event: IpcMainInvokeEvent, id: number): number {
  try {
    const result = db.prepare(`
      DELETE FROM controls WHERE id = ?
    `).run(id);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function getFormControls(event: IpcMainInvokeEvent, guiName: string): FormControl[] {
  try {
    const stmnt = db.prepare(`
    SELECT controls.*, choices.* FROM controls
    LEFT JOIN choices ON controls.id = choices.controlId
    WHERE controls.guiName = ?;
  `);

    const result: any[] = stmnt.all(guiName);

    if (!result.length) return [];

    const controls: { [key: number]: FormControl } = {};

    for (const ctrl of result) {
      const { chValue, chLabel, controlId, ...ctrlData } = ctrl;
      const id = ctrl.id;
      ctrlData.choices = [];

      if (!controls[id])
        controls[id] = ctrlData;

      if (controlId)
        controls[id].choices.push({ chValue, chLabel });
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