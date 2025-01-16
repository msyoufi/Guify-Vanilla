import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join as joinPath } from 'node:path';
import * as formsDB from './db/scripts/forms-db-manager.js';
import * as entriesDB from './db/scripts/entries-db-manager.js';

let MAIN_WINDOW: BrowserWindow;
let projectWindow: BrowserWindow;

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  MAIN_WINDOW = createWindow('index');
  MAIN_WINDOW.on('closed', quitApp);

  ipcMain.handle('window:close', e => e.sender.close());

  ipcMain.handle('project:insert', formsDB.insertProject);
  ipcMain.handle('project:get-all', formsDB.getProjects);
  ipcMain.handle('project:open', openProject);
  ipcMain.handle('project:delete', deleteProject);
  ipcMain.handle('project:production', makeProduction);

  ipcMain.handle('form-control:insert', formsDB.insertFormControl);
  ipcMain.handle('form-control:update', formsDB.updateFormControl);
  ipcMain.handle('form-control:delete', formsDB.deleteFormControl);
  ipcMain.handle('form-control:get-all', formsDB.getFormControls);

  ipcMain.handle('entry:update', updateEntry);
  ipcMain.handle('entry:delete', entriesDB.deleteEntry);
  ipcMain.handle('entry:get-all', entriesDB.getEntries);

  ipcMain.handle('entry-form:open', openEntryForm);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

function openProject(e: IpcMainInvokeEvent, project: GuifyProject): void {
  const template = project.production ? 'project-viewer' : 'project-editor';
  projectWindow = createWindow(template);
  sendAfterLoad(projectWindow, 'project:data', project);
}

function deleteProject(e: IpcMainInvokeEvent, project: GuifyProject): void {
  try {
    const changes = formsDB.deleteProject(project.id);
    if (!changes) throw new Error();

    if (project.production)
      entriesDB.deleteTable(project);

  } catch (err) {
    console.log(err)
    throw err;
  }
}

function makeProduction(e: IpcMainInvokeEvent, project: GuifyProject, controls: FormControl[]): void {
  try {
    const result = formsDB.updateProject(e, project.id, 'production', 1);
    if (!result) throw new Error();

    entriesDB.createDataTable(project, controls);
    MAIN_WINDOW.webContents.send('project:data');

  } catch (err) {
    throw err;
  }
}

function openEntryForm(e: IpcMainInvokeEvent, project: GuifyProject, entry: any): void {
  const window = createWindow('entry-form');
  const controls = formsDB.getFormControls(e, project.id);
  sendAfterLoad(window, 'entry-form:data', project, controls, entry);
}

function updateEntry(e: IpcMainInvokeEvent, project: GuifyProject, data: Record<string, any>, type: 'insert' | 'update'): number {
  let changes = 0;

  if (type === 'insert')
    changes = entriesDB.insertEntry(project, data);
  else
    changes = entriesDB.updateEntry(project, data);

  if (changes)
    projectWindow.webContents.send('project:data', project);

  return changes;
}

// Utils

function createWindow(templateName: string): BrowserWindow {
  const tempalteFile = pathTo(`assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: { preload: pathTo('preload.js') }
  });

  window.maximize();
  window.loadFile(tempalteFile);
  window.webContents.openDevTools({ mode: 'right' });
  window.on('ready-to-show', window.show);

  return window;
}

function sendAfterLoad(win: BrowserWindow, channel: string, ...args: any): void {
  win.webContents.on('did-finish-load', () => {
    win.webContents.send(channel, ...args);
  });
}

export function pathTo(path: string): string {
  return joinPath(app.getAppPath(), 'src', path);
}

function quitApp() {
  formsDB.close();
  entriesDB.close();
  app.quit();
}