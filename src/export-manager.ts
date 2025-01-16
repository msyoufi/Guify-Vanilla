import { IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs';
import { pathTo } from './main.js';
import * as formsDB from './db/scripts/forms-db-manager.js';
import * as entriesDB from './db/scripts/entries-db-manager.js';

export function exportData(e: IpcMainInvokeEvent, project: GuifyProject): void {
  try {
    const data = entriesDB.getEntries(e, project);
    const cleanedData: any[] = [];

    for (const dataPoint of data) {
      const { project_id, ...cleanData } = dataPoint;
      cleanedData.push(cleanData);
    }

    const jsonData = JSON.stringify(cleanedData, null, 2);
    fs.writeFileSync(pathTo(`${project.name}_daten.json`), jsonData, 'utf-8');

  } catch (err) {
    throw err;
  }
}
