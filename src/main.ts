import { app, BrowserWindow, ipcMain } from 'electron';
import { join as joinPath } from 'node:path';
import * as fromsDB from './db/scripts/forms-db-manager.js';

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  const mainWindow = createWindow('index');
  mainWindow.on('closed', quitApp);

  ipcMain.handle('form-control:insert', fromsDB.insertFormControl);
  ipcMain.handle('form-control:update', fromsDB.updateFormControl);
  ipcMain.handle('form-control:delete', fromsDB.deleteFormControl);
  ipcMain.handle('form-control:get-all', fromsDB.getFormControls);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

function createWindow(templateName: string): BrowserWindow {
  const tempalteFile = pathTo(`assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: { preload: pathTo('preload.js') }
  });

  window.maximize();
  window.loadFile(tempalteFile);
  window.on('ready-to-show', window.show);

  return window;
}

export function pathTo(path: string): string {
  return joinPath(app.getAppPath(), 'src', path);
}

function quitApp() {
  fromsDB.close();
  app.quit();
}