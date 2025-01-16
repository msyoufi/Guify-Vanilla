import Database, { RunResult } from 'better-sqlite3';

export function dynamicInsert(db: Database.Database, table: string, data: Record<string, any>): RunResult {
  try {
    const keys = Object.keys(data);
    const columns = keys.join(', ');
    const params = keys.map(key => '@' + key).join(', ');

    const result = db.prepare(`
      INSERT INTO ${table} (${columns}) VALUES (${params})
    `).run(data);

    return result;

  } catch (err: unknown) {
    throw err;
  }
}

export function dynamicUpdate(db: Database.Database, table: string, data: Record<string, any>, condition: string): number {
  try {
    const keys = Object.keys(data);
    const values = keys.map(key => key + ' = @' + key).join(', ');

    const result = db.prepare(`
      UPDATE ${table} SET ${values} WHERE ${condition}
    `).run(data);

    return result.changes;

  } catch (err: unknown) {
    throw err;
  }
}