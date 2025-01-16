import Database from 'better-sqlite3';
import { pathTo } from '../../main.js';
import { IpcMainInvokeEvent } from 'electron';
import { dynamicInsert, dynamicUpdate } from './db-utils.js';

const db = new Database(pathTo('db/entries.db'));
db.pragma('journal_mode = WAL');

export function createDataTable(project: GuifyProject, controls: FormControl[]): void {
  try {
    const columnsStr = getColumnsStr(controls);
    const table = getTableName(project);

    db.prepare(`
      CREATE TABLE IF NOT EXISTS ${table} (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        project_id INTEGER NOT NULL,
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

export function deleteTable(project: GuifyProject): void {
  try {
    const table = getTableName(project);
    db.prepare(`DROP TABLE ${table}`).run();

  } catch (err: unknown) {
    throw err;
  }
}

export function insertEntry(project: GuifyProject, data: Record<string, any>): number {
  try {
    const table = getTableName(project);
    const result = dynamicInsert(db, table, data);
    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function updateEntry(project: GuifyProject, data: Record<string, any>): number {
  try {
    const table = getTableName(project);
    return dynamicUpdate(db, table, data, `entry_id = ${data.entry_id}`);

  } catch (err: unknown) {
    throw err;
  }
}

export function deleteEntry(_: IpcMainInvokeEvent, project: GuifyProject, id: number): number {
  try {
    const table = getTableName(project);
    const result = db.prepare(`
      DELETE FROM ${table} WHERE entry_id = ?
    `).run(id);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}

export function getEntries(_: IpcMainInvokeEvent, project: GuifyProject): any[] {
  try {
    const table = getTableName(project);
    return db.prepare(`SELECT * FROM ${table}`).all();

  } catch (err: unknown) {
    throw err;
  }
}

function getTableName(project: GuifyProject): string {
  return project.name.replaceAll(' ', '_') + `__${project.id}`;
}

export function close(): void {
  try {
    db.close();
  } catch (err: unknown) {
    throw err;
  }
}