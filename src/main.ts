import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join as joinPath } from 'node:path';
import * as fromsDB from './db/scripts/forms-db-manager.js';

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  const mainWindow = createWindow('index');
  mainWindow.on('closed', quitApp);

  ipcMain.handle('window:close', closeFocusedWindow);

  ipcMain.handle('gui:insert', fromsDB.insertGui);
  ipcMain.handle('gui:delete', fromsDB.deleteGui);
  ipcMain.handle('gui:get-all', fromsDB.getGuis);
  ipcMain.handle('gui:edit', openGuiEditor);
  ipcMain.handle('gui:use', openGuiForm);

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
  window.webContents.openDevTools({ mode: 'right' });
  window.on('ready-to-show', window.show);

  return window;
}

function openGuiEditor(e: IpcMainInvokeEvent, gui: GUI): void {
  const window = createWindow('gui-editor');
  sendAfterLoad(window, 'gui:data', gui);
}

function openGuiForm(e: IpcMainInvokeEvent, gui: GUI): void {
  const window = createWindow('gui-form');
  const controls = fromsDB.getFormControls(e, gui.gui_id);
  sendAfterLoad(window, 'gui:data', gui, controls);
}

function closeFocusedWindow(): void {
  BrowserWindow.getFocusedWindow()?.close();
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
  fromsDB.close();
  app.quit();
}