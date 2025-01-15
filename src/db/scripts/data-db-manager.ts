import Database from 'better-sqlite3';
import { pathTo } from '../../main.js';
import { IpcMainInvokeEvent } from 'electron';
import { dynamicInsert } from './db-utils.js';

export const db = new Database(pathTo('db/data.db'));
db.pragma('journal_mode = WAL');

export function createDataTable(gui: GUI, controls: FormControl[]): void {
  try {
    const columnsStr = getColumnsStr(controls);
    const table = getTableName(gui);

    db.prepare(`
      CREATE TABLE IF NOT EXISTS ${table} (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        gui_id INTEGER NOT NULL,
        ${columnsStr}
      )
    `).run();

  } catch (err: unknown) {
    throw err;
  }
}

function getColumnsStr(controls: FormControl[]): string {
  const columns = controls.map(c => {
    return `${c.guify_ctrl_name} TEXT ${c.guify_ctrl_required ? 'NOT NULL' : ''}`.trim();
  });

  return columns.join(', ');
}

export function deleteTable(gui: GUI): void {
  try {
    const table = getTableName(gui);
    db.prepare(`DROP TABLE ${table}`).run();

  } catch (err: unknown) {
    throw err;
  }
}

export function insertEntry(_: IpcMainInvokeEvent, gui: GUI, data: Record<string, any>): number {
  try {
    const table = getTableName(gui);
    const result = dynamicInsert(db, table, data);
    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

function getTableName(gui: GUI): string {
  return gui.gui_name.replaceAll(' ', '_') + `__${gui.gui_id}`;
}

export function close(): void {
  try {
    db.close();
  } catch (err: unknown) {
    throw err;
  }
}