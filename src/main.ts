import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join as joinPath } from 'node:path';
import * as fromsDB from './db/scripts/forms-db-manager.js';
import * as entriesDB from './db/scripts/entries-db-manager.js';

let MAIN_WINDOW: BrowserWindow;

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  MAIN_WINDOW = createWindow('index');
  MAIN_WINDOW.on('closed', quitApp);

  ipcMain.handle('window:close', closeFocusedWindow);

  ipcMain.handle('project:insert', fromsDB.insertProject);
  ipcMain.handle('project:get-all', fromsDB.getProjects);
  ipcMain.handle('project:open', openProject);
  ipcMain.handle('project:delete', deleteProject);
  ipcMain.handle('project:production', makeProduction);

  ipcMain.handle('form-control:insert', fromsDB.insertFormControl);
  ipcMain.handle('form-control:update', fromsDB.updateFormControl);
  ipcMain.handle('form-control:delete', fromsDB.deleteFormControl);
  ipcMain.handle('form-control:get-all', fromsDB.getFormControls);

  ipcMain.handle('entry:insert', entriesDB.insertEntry);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

function openProject(e: IpcMainInvokeEvent, project: GuifyProject): void {
  const template = project.production ? 'entry-form' : 'project-editor';
  const window = createWindow(template);

  sendAfterLoad(window, 'project:data', project);
}

function deleteProject(e: IpcMainInvokeEvent, project: GuifyProject): void {
  try {
    const changes = fromsDB.deleteProject(project.id);
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
    const result = fromsDB.updateProject(e, project.id, 'production', 1);
    if (!result) throw new Error();

    entriesDB.createDataTable(project, controls);
    MAIN_WINDOW.webContents.send('project:data');

  } catch (err) {
    throw err;
  }
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

function closeFocusedWindow(): void {
  BrowserWindow.getFocusedWindow()?.close();
}

function quitApp() {
  fromsDB.close();
  entriesDB.close();
  app.quit();
}